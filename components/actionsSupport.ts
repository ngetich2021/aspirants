'use server';

import prisma from '@/lib/prisma';

export type ActionResponse = {
  success?: string;
  error?: string;
};

export async function createFundsDonation(formData: FormData): Promise<ActionResponse> {
  try {
    const name = formData.get('name') as string | null;
    const amountStr = formData.get('amount') as string;
    const tel = formData.get('tel') as string | null;

    const amount = Number(amountStr);
    if (Number.isNaN(amount) || amount < 100) {
      return { error: 'Please enter a valid amount (minimum 100 KES).' };
    }

    await prisma.funds.create({
      data: {
        name: name?.trim() || null,
        amount,
        tel: tel?.trim() || null,
      },
    });

    return { success: 'Thank you! Your donation has been recorded.' };
  } catch (err) {
    console.error('Funds donation error:', err);
    return { error: 'Failed to record donation. Please try again.' };
  }
}

export async function createGiftDonation(formData: FormData): Promise<ActionResponse> {
  try {
    const name = formData.get('name') as string | null;
    const describe = formData.get('describe') as string;
    const tel = formData.get('tel') as string | null;

    if (!describe?.trim()) {
      return { error: 'Please describe your gift or service.' };
    }

    await prisma.gifts.create({
      data: {
        name: name?.trim() || null,
        describe: describe.trim(),
        tel: tel?.trim() || null,
      },
    });

    return { success: 'Thank you! Your gift offer has been received.' };
  } catch (err) {
    console.error('Gift donation error:', err);
    return { error: 'Failed to record gift. Please try again.' };
  }
}

export async function createSkillAgent(formData: FormData): Promise<ActionResponse> {
  try {
    const fullName = formData.get('name') as string;
    const tel = formData.get('tel') as string;
    const pollingStationId = formData.get('pollingStationId') as string;
    const position = formData.get('position') as string;

    if (!fullName?.trim() || !tel?.trim() || !pollingStationId?.trim() || !position?.trim()) {
      return { error: 'Full name, phone number, polling station, and position are required.' };
    }

    await prisma.agent.create({
      data: {
        fullName: fullName.trim(),
        tel: tel.trim(),
        pollingStationId,
        position: position.trim(),
      },
    });

    return { success: 'Thank you! You have been registered as an agent.' };
  } catch (error) {
    console.error('Agent registration error:', error);
    return { error: 'Failed to register. Please try again later.' };
  }
}