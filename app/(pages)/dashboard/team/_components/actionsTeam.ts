// app/team/_components/actionsTeam.ts
'use server';

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { v2 as cloudinary } from 'cloudinary';
import type { UploadApiResponse } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
  api_key:    process.env.CLOUDINARY_API_KEY!,
  api_secret: process.env.CLOUDINARY_API_SECRET!,
  secure:     true,
});

type ActionResult = { success: true } | { success: false; error: string };

// ── Officials ───────────────────────────────────────────────

export async function saveOfficialAction(formData: FormData): Promise<ActionResult> {
  const userId           = formData.get("userId") as string | null;
  const fullNameRaw      = formData.get("fullName") as string | null;
  const designationIdRaw = formData.get("designation") as string | null;
  const telRaw           = formData.get("tel") as string | null;
  const tel2Raw          = formData.get("tel2") as string | null;
  const stationRaw       = formData.get("station") as string | null;
  const imageFile        = formData.get("image") as File | null;

  if (!userId)           return { success: false, error: "User ID is required" };
  if (!designationIdRaw) return { success: false, error: "Designation is required" };
  if (!telRaw)           return { success: false, error: "Primary phone is required" };
  if (!stationRaw)       return { success: false, error: "Polling station is required" };

  const fullName         = fullNameRaw?.trim() || "Unnamed Official";
  const designationId    = designationIdRaw.trim();
  const tel              = telRaw.trim();
  const tel2             = tel2Raw?.trim() ?? null;
  const pollingStationId = stationRaw.trim();

  const designation = await prisma.designation.findUnique({
    where: { id: designationId },
    select: { name: true },
  });

  if (!designation) return { success: false, error: "Selected designation not found" };

  let imageUrl: string;

  if (imageFile && imageFile.size > 0) {
    try {
      const buffer = Buffer.from(await imageFile.arrayBuffer());

      const result = await new Promise<UploadApiResponse>((resolve, reject) => {
        cloudinary.uploader.upload_stream(
          {
            folder:       "officials",
            public_id:    `official-${userId}-${Date.now()}`,
            overwrite:    true,
            quality:      "auto:good",
            fetch_format: "auto",
            width:        800,
            height:       800,
            crop:         "limit",
          },
          (error, result) => error ? reject(error) : result ? resolve(result) : reject(new Error("No result")),
        ).end(buffer);
      });

      imageUrl = result.secure_url;

      // Clean up old image
      const existing = await prisma.profile.findUnique({ where: { userId }, select: { image: true } });
      if (existing?.image) {
        const publicId = getPublicIdFromUrl(existing.image);
        if (publicId) cloudinary.uploader.destroy(publicId).catch(() => {});
      }
    } catch (err) {
      console.error("Cloudinary upload failed:", err);
      return { success: false, error: "Failed to upload photo" };
    }
  } else {
    const existing = await prisma.profile.findUnique({ where: { userId }, select: { image: true } });
    if (!existing?.image) return { success: false, error: "Profile photo is required" };
    imageUrl = existing.image;
  }

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
        image: imageUrl,
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

    revalidatePath("/team", "page");
    return { success: true };
  } catch (error) {
    console.error("Save official failed:", error);
    return { success: false, error: "Failed to save official" };
  }
}

export async function deleteOfficialAction(userId: string): Promise<ActionResult> {
  try {
    const official = await prisma.profile.findUnique({
      where: { userId },
      select: { image: true },
    });

    if (official?.image) {
      const publicId = getPublicIdFromUrl(official.image);
      if (publicId) cloudinary.uploader.destroy(publicId).catch(() => {});
    }

    await prisma.profile.delete({ where: { userId } });
    revalidatePath("/team", "page");
    return { success: true };
  } catch (error) {
    console.error("Delete failed:", error);
    return { success: false, error: "Failed to delete" };
  }
}

// ── Designations ────────────────────────────────────────────

export async function addDesignationAction(formData: FormData): Promise<ActionResult> {
  const name        = (formData.get("name") as string)?.trim();
  const description = (formData.get("description") as string)?.trim() || null;

  if (!name) return { success: false, error: "Name is required" };

  try {
    await prisma.designation.create({
      data: { name, description },
    });
    revalidatePath("/team", "page");
    return { success: true };
  } catch (err) {
    console.error("Add designation failed:", err);
    return { success: false, error: "Failed to create designation (name may already exist)" };
  }
}

export async function editDesignationAction(formData: FormData): Promise<ActionResult> {
  const id          = formData.get("id") as string;
  const name        = (formData.get("name") as string)?.trim();
  const description = (formData.get("description") as string)?.trim() || null;

  if (!id || !name) return { success: false, error: "ID and name are required" };

  try {
    await prisma.designation.update({
      where: { id },
      data: { name, description },
    });
    revalidatePath("/team", "page");
    return { success: true };
  } catch (err) {
    console.error("Edit designation failed:", err);
    return { success: false, error: "Failed to update designation" };
  }
}

export async function deleteDesignationAction(formData: FormData): Promise<ActionResult> {
  const id = formData.get("id") as string;

  if (!id) return { success: false, error: "ID is required" };

  try {
    // Optional: check if used in profiles
    const usageCount = await prisma.profile.count({ where: { designationId: id } });
    if (usageCount > 0) {
      return { success: false, error: `Cannot delete – used by ${usageCount} official(s)` };
    }

    await prisma.designation.delete({ where: { id } });
    revalidatePath("/team", "page");
    return { success: true };
  } catch (err) {
    console.error("Delete designation failed:", err);
    return { success: false, error: "Failed to delete designation" };
  }
}

export async function getDesignationsAction() {
  return prisma.designation.findMany({
    orderBy: { name: "asc" },
  });
}

export async function getUsersStationsDesignations() {
  const [users, stations, designations] = await Promise.all([
    prisma.user.findMany({
      where: { email: { not: null } },
      select: { id: true, email: true, name: true },
      orderBy: { email: "asc" },
    }),
    prisma.pollingStation.findMany({
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    prisma.designation.findMany({
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);

  return { users, stations, designations };
}

// Helper
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