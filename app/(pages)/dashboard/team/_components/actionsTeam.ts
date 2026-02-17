'use server';

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { v2 as cloudinary } from 'cloudinary';
import type { UploadApiResponse } from 'cloudinary';
import { Prisma } from '@/lib/generated/prisma/client';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
  api_key: process.env.CLOUDINARY_API_KEY!,
  api_secret: process.env.CLOUDINARY_API_SECRET!,
  secure: true,
});

type ActionResult = { success: true } | { success: false; error: string };

// ──────────────────────────────────────────────────────────────
//                           HELPERS
// ──────────────────────────────────────────────────────────────

function getPublicIdFromUrl(url: string): string | null {
  try {
    const parts = url.split('/');
    const uploadIdx = parts.indexOf('upload');
    if (uploadIdx === -1) return null;
    let start = uploadIdx + 1;
    if (/^v\d+$/.test(parts[start])) start++;
    const idWithExt = parts.slice(start).join('/');
    return idWithExt.replace(/\.[^.]+$/, '');
  } catch {
    return null;
  }
}

// Type guard helper for Prisma errors (prevents 'unknown' issues)
function isPrismaKnownError(err: unknown): err is Prisma.PrismaClientKnownRequestError {
  return err instanceof Prisma.PrismaClientKnownRequestError;
}

// ──────────────────────────────────────────────────────────────
//             GET DATA FOR OFFICIAL FORM DROPDOWNS
// ──────────────────────────────────────────────────────────────

export async function getUsersStationsDesignations() {
  const [users, stations, designations] = await Promise.all([
    prisma.user.findMany({
      where: { email: { not: null } },
      select: { id: true, email: true, name: true },
      orderBy: { email: 'asc' },
    }),
    prisma.pollingStation.findMany({
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    }),
    prisma.designation.findMany({
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    }),
  ]);

  return { users, stations, designations };
}

// ──────────────────────────────────────────────────────────────
//                    OFFICIALS — SAVE / UPSERT
// ──────────────────────────────────────────────────────────────

export async function saveOfficialAction(formData: FormData): Promise<ActionResult> {
  const userId           = formData.get('userId') as string | null;
  const fullNameRaw      = formData.get('fullName') as string | null;
  const designationIdRaw = formData.get('designation') as string | null;
  const telRaw           = formData.get('tel') as string | null;
  const tel2Raw          = formData.get('tel2') as string | null;
  const stationRaw       = formData.get('station') as string | null;
  const imageFile        = formData.get('image') as File | null;

  console.log('[saveOfficialAction] Received:', {
    userId,
    fullName: fullNameRaw,
    designationId: designationIdRaw,
    tel: telRaw,
    station: stationRaw,
    imageFile: imageFile ? { name: imageFile.name, size: imageFile.size } : null,
  });

  // Required fields validation
  if (!userId)           return { success: false, error: 'Please select a user' };
  if (!designationIdRaw) return { success: false, error: 'Designation is required' };
  if (!telRaw)           return { success: false, error: 'Primary phone number is required' };
  if (!stationRaw)       return { success: false, error: 'Polling station is required' };

  const fullName         = fullNameRaw?.trim() || 'Unnamed Official';
  const designationId    = designationIdRaw.trim();
  const tel              = telRaw.trim();
  const tel2             = tel2Raw?.trim() ?? null;
  const pollingStationId = stationRaw.trim();

  // Verify designation exists
  const designation = await prisma.designation.findUnique({
    where: { id: designationId },
    select: { name: true },
  });

  if (!designation) {
    return { success: false, error: 'The selected designation could not be found. Please choose another one.' };
  }

  // Prevent duplicate phone numbers (except for the same user during edit)
  if (tel) {
    const existingWithTel = await prisma.profile.findFirst({
      where: { tel },
      select: { userId: true, fullName: true },
    });

    if (existingWithTel && existingWithTel.userId !== userId) {
      return {
        success: false,
        error: `The phone number ${tel} is already used. Please use a different number.`,
      };
    }
  }

  // ── Image handling ─────────────────────────────────────────────
  let imageUrl: string | null = null;

  if (imageFile && imageFile.size > 0) {
    try {
      const buffer = Buffer.from(await imageFile.arrayBuffer());

      const uploadResult = await new Promise<UploadApiResponse>((resolve, reject) => {
        cloudinary.uploader.upload_stream(
          {
            folder:       'officials',
            public_id:    `official-${userId}-${Date.now()}`,
            overwrite:    true,
            quality:      'auto:good',
            fetch_format: 'auto',
            width:        800,
            height:       800,
            crop:         'limit',
          },
          (error, result) => {
            if (error) return reject(error);
            if (result) return resolve(result);
            reject(new Error('Cloudinary upload returned no result'));
          },
        ).end(buffer);
      });

      imageUrl = uploadResult.secure_url;

      // Optional cleanup of old image
      const existing = await prisma.profile.findUnique({
        where: { userId },
        select: { image: true },
      });

      if (existing?.image) {
        const publicId = getPublicIdFromUrl(existing.image);
        if (publicId) {
          cloudinary.uploader.destroy(publicId).catch((err) => {
            console.warn('Failed to delete old Cloudinary image:', err);
          });
        }
      }
    } catch (err) {
      console.error('Cloudinary upload failed:', err);
      return { success: false, error: 'Could not upload the photo. Please try a different image or leave it blank for now.' };
    }
  } else {
    const existing = await prisma.profile.findUnique({
      where: { userId },
      select: { image: true },
    });
    imageUrl = existing?.image ?? null;
  }

  // ── Perform upsert ─────────────────────────────────────────────
  try {
    await prisma.profile.upsert({
      where: { userId },
      update: {
        fullName,
        designationId,
        role: designation.name,
        tel,
        tel2,
        pollingStationId,
        ...(imageUrl !== null && { image: imageUrl }),
      },
      create: {
        userId,
        fullName,
        designationId,
        role: designation.name,
        tel,
        tel2,
        pollingStationId,
        image: imageUrl,
      },
    });

    revalidatePath('/team');
    revalidatePath('/team', 'page');

    return { success: true };
  } catch (err: unknown) {
    console.error('[saveOfficialAction] Error during upsert:', err);

    if (isPrismaKnownError(err)) {
      if (err.code === 'P2002') {
        const target = (err.meta?.target as string[] | undefined)?.[0];
        if (target === 'tel') {
          return {
            success: false,
            error: `The phone number ${tel} is already used by another team member. Please use a different number.`,
          };
        }
        return {
          success: false,
          error: 'One of the values you entered is already in use. Please check phone number and try again.',
        };
      }

      if (err.code === 'P2025') {
        return {
          success: false,
          error: 'Some related information (designation or station) could not be found. Please refresh the page and try again.',
        };
      }

      return {
        success: false,
        error: 'There was a problem with the database. Please try again or contact support.',
      };
    }

    // Non-Prisma errors
    return {
      success: false,
      error: 'Something went wrong while saving. Please check your connection and try again.',
    };
  }
}

// ──────────────────────────────────────────────────────────────
//                        DELETE OFFICIAL
// ──────────────────────────────────────────────────────────────

export async function deleteOfficialAction(userId: string): Promise<ActionResult> {
  try {
    const official = await prisma.profile.findUnique({
      where: { userId },
      select: { image: true, fullName: true },
    });

    if (!official) {
      return { success: false, error: 'This team member could not be found.' };
    }

    if (official.image) {
      const publicId = getPublicIdFromUrl(official.image);
      if (publicId) {
        cloudinary.uploader.destroy(publicId).catch(() => {});
      }
    }

    await prisma.profile.delete({ where: { userId } });

    revalidatePath('/team');
    revalidatePath('/team', 'page');

    return { success: true };
  } catch (err: unknown) {
    console.error('Delete official failed:', err);
    return {
      success: false,
      error: 'Could not delete this team member. Please try again or contact support if the issue persists.',
    };
  }
}

// ──────────────────────────────────────────────────────────────
//                        DESIGNATIONS
// ──────────────────────────────────────────────────────────────

export async function addDesignationAction(formData: FormData): Promise<ActionResult> {
  const name        = (formData.get('name') as string)?.trim();
  const description = (formData.get('description') as string)?.trim() || null;

  if (!name) {
    return { success: false, error: 'Designation name is required' };
  }

  try {
    await prisma.designation.create({
      data: { name, description },
    });

    revalidatePath('/team');
    revalidatePath('/team', 'page');

    return { success: true };
  } catch (err: unknown) {
    if (isPrismaKnownError(err) && err.code === 'P2002') {
      return {
        success: false,
        error: `A designation named "${name}" already exists. Please choose a different name.`,
      };
    }

    console.error('Add designation failed:', err);
    return {
      success: false,
      error: 'Could not create the new designation. Please try again.',
    };
  }
}

export async function editDesignationAction(formData: FormData): Promise<ActionResult> {
  const id          = formData.get('id') as string;
  const name        = (formData.get('name') as string)?.trim();
  const description = (formData.get('description') as string)?.trim() || null;

  if (!id || !name) {
    return { success: false, error: 'Designation ID and name are required' };
  }

  try {
    await prisma.designation.update({
      where: { id },
      data: { name, description },
    });

    revalidatePath('/team');
    revalidatePath('/team', 'page');

    return { success: true };
  } catch (err: unknown) {
    if (isPrismaKnownError(err) && err.code === 'P2002') {
      return {
        success: false,
        error: `Another designation already uses the name "${name}". Please choose a different name.`,
      };
    }

    console.error('Edit designation failed:', err);
    return {
      success: false,
      error: 'Could not update the designation. Please try again.',
    };
  }
}

export async function deleteDesignationAction(formData: FormData): Promise<ActionResult> {
  const id = formData.get('id') as string;

  if (!id) {
    return { success: false, error: 'Designation ID is required' };
  }

  try {
    const usageCount = await prisma.profile.count({
      where: { designationId: id },
    });

    if (usageCount > 0) {
      return {
        success: false,
        error: `This designation is currently assigned to ${usageCount} team member(s). You must reassign them before deleting it.`,
      };
    }

    await prisma.designation.delete({ where: { id } });

    revalidatePath('/team');
    revalidatePath('/team', 'page');

    return { success: true };
  } catch (err: unknown) {
    console.error('Delete designation failed:', err);
    return {
      success: false,
      error: 'Could not delete the designation. Please try again.',
    };
  }
}

export async function getDesignationsAction() {
  return prisma.designation.findMany({
    orderBy: { name: 'asc' },
  });
}