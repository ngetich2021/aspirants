'use server';

import prisma from '@/lib/prisma';

export type ActionResponse = {
  success?: string;
  error?: string;
  redirectUrl?: string;
};

export async function createFundsDonation(formData: FormData): Promise<ActionResponse> {
  try {
    const name = (formData.get('name') as string | null)?.trim() || null;
    const amountStr = formData.get('amount') as string;
    const telRaw = (formData.get('tel') as string | null)?.trim();
    const paymentMethod = formData.get('paymentMethod') as 'mpesa' | 'card' | null;

    const amount = Number(amountStr);
    if (Number.isNaN(amount) || amount < 50) {
      return { error: 'Please enter a valid amount (minimum 100 KES).' };
    }

    if (!telRaw || !/^0[17][0-9]{8}$/.test(telRaw)) {
      return { error: 'Valid Kenyan phone number required (e.g. 0712345678)' };
    }

    const phone = telRaw.startsWith('0') ? '254' + telRaw.slice(1) : telRaw;

    if (paymentMethod === 'mpesa') {
      const SHORTCODE = process.env.MPESA_SHORTCODE;
      const PASSKEY = process.env.MPESA_PASSKEY;
      const CONSUMER_KEY = process.env.MPESA_CONSUMER_KEY;
      const CONSUMER_SECRET = process.env.MPESA_CONSUMER_SECRET;
      const CALLBACK_URL = `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/mpesa`;

      if (!SHORTCODE || !PASSKEY || !CONSUMER_KEY || !CONSUMER_SECRET) {
        return { error: 'M-Pesa configuration missing. Contact support.' };
      }

      const auth = Buffer.from(`${CONSUMER_KEY}:${CONSUMER_SECRET}`).toString('base64');
      const tokenRes = await fetch(
        'https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials',
        { headers: { Authorization: `Basic ${auth}` } }
      );

      if (!tokenRes.ok) throw new Error('M-Pesa auth failed');
      const { access_token } = await tokenRes.json();

      const timestamp = new Date().toISOString().replace(/[^0-9]/g, '').slice(0, 14);
      const password = Buffer.from(`${SHORTCODE}${PASSKEY}${timestamp}`).toString('base64');

      const payload = {
        BusinessShortCode: SHORTCODE,
        Password: password,
        Timestamp: timestamp,
        TransactionType: 'CustomerPayBillOnline',
        Amount: Math.round(amount),
        PartyA: phone,
        PartyB: SHORTCODE,
        PhoneNumber: phone,
        CallBackURL: CALLBACK_URL,
        AccountReference: `DON-${Date.now()}`,
        TransactionDesc: 'Support donation',
      };

      const stkRes = await fetch('https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const stkData = await stkRes.json();

      if (stkData.ResponseCode !== '0') {
        return { error: stkData.errorMessage || 'M-Pesa request failed. Try again.' };
      }

      await prisma.funds.create({
        data: { name, amount, tel: telRaw, status: 'pending' },
      });

      return { success: 'M-Pesa prompt sent! Check your phone and enter PIN.' };
    }

    if (paymentMethod === 'card') {
      const PESAPAL_CONSUMER_KEY = process.env.PESAPAL_CONSUMER_KEY;
      const PESAPAL_CONSUMER_SECRET = process.env.PESAPAL_CONSUMER_SECRET;
      const PESAPAL_NOTIFICATION_ID = process.env.PESAPAL_NOTIFICATION_ID;

      if (!PESAPAL_CONSUMER_KEY || !PESAPAL_CONSUMER_SECRET || !PESAPAL_NOTIFICATION_ID) {
        return { error: 'Pesapal configuration missing. Contact support.' };
      }

      const txRef = `pesapal-card-${Date.now()}`;
      const callbackUrl = `${process.env.NEXT_PUBLIC_APP_URL}/thank-you?tx_ref=${txRef}`;

      const authRes = await fetch('https://cybqa.pesapal.com/pesapalv3/api/Auth/RequestToken', {
        method: 'POST',
        headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
        body: JSON.stringify({
          consumer_key: PESAPAL_CONSUMER_KEY,
          consumer_secret: PESAPAL_CONSUMER_SECRET,
        }),
      });

      if (!authRes.ok) throw new Error('Pesapal authentication failed');
      const { token } = await authRes.json();

      const payload = {
        id: txRef,
        currency: 'KES',
        amount,
        description: 'Support donation',
        callback_url: callbackUrl,
        notification_id: PESAPAL_NOTIFICATION_ID,
        billing_address: {
          email_address: 'donor@example.com',
          phone_number: telRaw,
          country_code: 'KE',
          first_name: name || 'Anonymous Donor',
          last_name: '',
        },
      };

      const orderRes = await fetch('https://cybqa.pesapal.com/pesapalv3/api/Transactions/SubmitOrderRequest', {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const orderData = await orderRes.json();

      if (orderData.status !== '200' || orderData.error) {
        return { error: orderData.message || 'Pesapal payment initiation failed.' };
      }

      await prisma.funds.create({
        data: { name, amount, tel: telRaw, status: 'pending_card' },
      });

      return {
        success: 'Redirecting to secure Pesapal payment page...',
        redirectUrl: orderData.redirect_url,
      };
    }

    return { error: 'Invalid payment method.' };
  } catch (err) {
    console.error('Funds error:', err);
    return { error: 'Payment processing failed. Please try again.' };
  }
}

export async function createGiftDonation(formData: FormData): Promise<ActionResponse> {
  try {
    const name = (formData.get('name') as string | null)?.trim() || null;
    const describe = (formData.get('describe') as string)?.trim();
    const tel = (formData.get('tel') as string | null)?.trim() || null;

    if (!describe) return { error: 'Please describe your gift or service.' };

    await prisma.gifts.create({ data: { name, describe, tel } });
    return { success: 'Thank you! Your gift offer has been received.' };
  } catch (err) {
    console.error('Gift error:', err);
    return { error: 'Failed to record gift. Please try again.' };
  }
}

export async function createSkillAgent(formData: FormData): Promise<ActionResponse> {
  try {
    const fullName = (formData.get('name') as string)?.trim();
    const tel = (formData.get('tel') as string)?.trim();
    const pollingStationId = formData.get('pollingStationId') as string;
    const position = (formData.get('position') as string)?.trim();

    if (!fullName || !tel || !pollingStationId || !position) {
      return { error: 'All fields are required.' };
    }

    await prisma.agent.create({ data: { fullName, tel, pollingStationId, position } });
    return { success: 'Thank you! You have been registered as an agent.' };
  } catch (err) {
    console.error('Agent error:', err);
    return { error: 'Failed to register. Please try again.' };
  }
}