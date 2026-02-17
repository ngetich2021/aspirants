'use server';

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { v2 as cloudinary } from 'cloudinary';
import type { UploadApiResponse } from 'cloudinary';

// Make sure cloudinary is configured (usually in a separate file or here)
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
  api_key: process.env.CLOUDINARY_API_KEY!,
  api_secret: process.env.CLOUDINARY_API_SECRET!,
  secure: true,
});

type ActionResult = { success: true } | { success: false; error: string };

export async function saveOfficialAction(formData: FormData): Promise<ActionResult> {
  const userId           = formData.get('userId') as string | null;
  const fullNameRaw      = formData.get('fullName') as string | null;
  const designationIdRaw = formData.get('designation') as string | null;
  const telRaw           = formData.get('tel') as string | null;
  const tel2Raw          = formData.get('tel2') as string | null;
  const stationRaw       = formData.get('station') as string | null;
  const imageFile        = formData.get('image') as File | null;

  // Debug log – keep during development
  console.log('saveOfficialAction received:', {
    userId,
    fullName: fullNameRaw,
    designationId: designationIdRaw,
    tel: telRaw,
    station: stationRaw,
    imageFilename: imageFile?.name ?? 'none',
    imageSize: imageFile?.size ?? 0,
  });

  // Required fields validation
  if (!userId) {
    return { success: false, error: 'User ID is required' };
  }
  if (!designationIdRaw) {
    return { success: false, error: 'Designation is required' };
  }
  if (!telRaw) {
    return { success: false, error: 'Primary phone is required' };
  }
  if (!stationRaw) {
    return { success: false, error: 'Polling station is required' };
  }

  const fullName         = fullNameRaw?.trim() || 'Unnamed Official';
  const designationId    = designationIdRaw.trim();
  const tel              = telRaw.trim();
  const tel2             = tel2Raw ? tel2Raw.trim() : null;
  const pollingStationId = stationRaw.trim();

  // Verify designation exists
  const designation = await prisma.designation.findUnique({
    where: { id: designationId },
    select: { name: true },
  });

  if (!designation) {
    return { success: false, error: 'Selected designation not found in database' };
  }

  let imageUrl: string | undefined;

  // ── Handle image upload or keep existing ───────────────────────────────
  if (imageFile && imageFile.size > 0) {
    try {
      const buffer = Buffer.from(await imageFile.arrayBuffer());

      const uploadResult = await new Promise<UploadApiResponse>((resolve, reject) => {
        cloudinary.uploader
          .upload_stream(
            {
              folder: 'officials',
              public_id: `official-${userId}-${Date.now()}`,
              overwrite: true,
              quality: 'auto:good',
              fetch_format: 'auto',
              width: 800,
              height: 800,
              crop: 'limit',
            },
            (error, result) => {
              if (error) return reject(error);
              if (result) return resolve(result);
              reject(new Error('Cloudinary returned no result'));
            },
          )
          .end(buffer);
      });

      imageUrl = uploadResult.secure_url;

      // Clean up old image if exists
      const existingProfile = await prisma.profile.findUnique({
        where: { userId },
        select: { image: true },
      });

      if (existingProfile?.image) {
        const publicId = getPublicIdFromUrl(existingProfile.image);
        if (publicId) {
          cloudinary.uploader.destroy(publicId).catch((err) => {
            console.warn('Failed to delete old Cloudinary image:', err);
          });
        }
      }
    } catch (err) {
      console.error('Cloudinary upload failed:', err);
      return { success: false, error: 'Failed to upload photo. Try again or skip image.' };
    }
  } else {
    // No new image uploaded → keep existing or fail if new record needs it
    const existingProfile = await prisma.profile.findUnique({
      where: { userId },
      select: { image: true },
    });

    // For new profiles: photo is required (you can make this optional by removing the check)
    if (!existingProfile?.image) {
      return { success: false, error: 'Profile photo is required for new officials' };
    }

    imageUrl = existingProfile.image; // keep current
  }

  // ── Upsert the profile ──────────────────────────────────────────────────
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
        ...(imageUrl !== undefined && { image: imageUrl }), // only update image if we have a value
      },
      create: {
        userId,
        fullName,
        designationId,
        role: designation.name,
        tel,
        tel2,
        pollingStationId,
        image: imageUrl ?? '', // fallback – consider a default URL if allowed
      },
    });

    revalidatePath('/team');
    revalidatePath('/team', 'page');

    return { success: true };
  } catch (err) {
    console.error('Prisma profile.upsert failed:', err);
    return { success: false, error: 'Failed to save official – check server logs for details' };
  }
}

// Assuming this helper exists in the same file
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