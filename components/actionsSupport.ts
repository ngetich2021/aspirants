'use server';

import prisma from '@/lib/prisma';

export type ActionResponse = {
  success?: string;
  error?: string;
  redirectUrl?: string; // for card gateways that redirect
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

    // Format phone for M-Pesa (2547xxxxxxxx)
    const phone = telRaw.startsWith('0') ? '254' + telRaw.slice(1) : telRaw;

    if (paymentMethod === 'mpesa') {
      // ────────────────────── M-PESA STK PUSH (Daraja) ──────────────────────
      // You MUST fill these from .env
      const SHORTCODE = process.env.MPESA_SHORTCODE;
      const PASSKEY = process.env.MPESA_PASSKEY;
      const CONSUMER_KEY = process.env.MPESA_CONSUMER_KEY;
      const CONSUMER_SECRET = process.env.MPESA_CONSUMER_SECRET;
      const CALLBACK_URL = `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/mpesa`;

      if (!SHORTCODE || !PASSKEY || !CONSUMER_KEY || !CONSUMER_SECRET) {
        return { error: 'M-Pesa configuration missing. Contact support.' };
      }

      // 1. Get OAuth token
      const auth = Buffer.from(`${CONSUMER_KEY}:${CONSUMER_SECRET}`).toString('base64');
      const tokenRes = await fetch(
        'https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials',
        { headers: { Authorization: `Basic ${auth}` } }
      );

      if (!tokenRes.ok) throw new Error('M-Pesa auth failed');

      const { access_token } = await tokenRes.json();

      // 2. STK Push
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

      // Save pending record
      await prisma.funds.create({
        data: { name, amount, tel: telRaw, status: 'pending' /* add status field if needed */ },
      });

      return {
        success: 'M-Pesa prompt sent! Check your phone and enter PIN.',
      };
    }

    if (paymentMethod === 'card') {
      // ────────────────────── FLUTTERWAVE CARD (example) ──────────────────────
      // You MUST fill these from .env
      const FLW_SECRET_KEY = process.env.FLUTTERWAVE_SECRET_KEY;
      const FLW_PUBLIC_KEY = process.env.FLUTTERWAVE_PUBLIC_KEY;

      if (!FLW_SECRET_KEY || !FLW_PUBLIC_KEY) {
        return { error: 'Card payment configuration missing. Contact support.' };
      }

      // Create Flutterwave payment link (redirect flow - simplest)
      const txRef = `card-${Date.now()}`;
      const redirectUrl = `${process.env.NEXT_PUBLIC_APP_URL}/thank-you?tx_ref=${txRef}`;

      const payload = {
        tx_ref: txRef,
        amount,
        currency: 'KES',
        redirect_url: redirectUrl,
        payment_options: 'card',
        customer: {
          email: 'donor@example.com', // collect email if needed
          name: name || 'Anonymous Donor',
          phonenumber: telRaw,
        },
        customizations: {
          title: 'Support Donation',
          description: 'Thank you for supporting our cause',
        },
      };

      const res = await fetch('https://api.flutterwave.com/v3/payments', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${FLW_SECRET_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (data.status !== 'success') {
        return { error: data.message || 'Card payment initiation failed.' };
      }

      // Save pending (you can update on webhook later)
      await prisma.funds.create({
        data: { name, amount, tel: telRaw, status: 'pending_card' },
      });

      return {
        success: 'Redirecting to secure card payment page...',
        redirectUrl: data.data.link, // client can window.location = this
      };
    }

    return { error: 'Invalid payment method.' };
  } catch (err) {
    console.error('Funds error:', err);
    return { error: 'Payment processing failed. Please try again.' };
  }
}

// The other two actions remain almost the same (unchanged logic)

export async function createGiftDonation(formData: FormData): Promise<ActionResponse> {
  try {
    const name = (formData.get('name') as string | null)?.trim() || null;
    const describe = (formData.get('describe') as string)?.trim();
    const tel = (formData.get('tel') as string | null)?.trim() || null;

    if (!describe) {
      return { error: 'Please describe your gift or service.' };
    }

    await prisma.gifts.create({
      data: { name, describe, tel },
    });

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

    await prisma.agent.create({
      data: { fullName, tel, pollingStationId, position },
    });

    return { success: 'Thank you! You have been registered as an agent.' };
  } catch (err) {
    console.error('Agent error:', err);
    return { error: 'Failed to register. Please try again.' };
  }
}