'use server';

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { v2 as cloudinary } from "cloudinary";
import type { UploadApiResponse, UploadApiErrorResponse } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
  api_key:    process.env.CLOUDINARY_API_KEY!,
  api_secret: process.env.CLOUDINARY_API_SECRET!,
  secure:     true,
});

type ActionResult =
  | { success: true }
  | { success: false; error: string };

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
  const designationId    = designationIdRaw?.trim() ?? "";
  const tel              = telRaw?.trim() ?? "";
  const tel2             = tel2Raw?.trim() ?? null;
  const pollingStationId = stationRaw?.trim() ?? "";

  if (!designationId)    return { success: false, error: "Designation is required" };
  if (!tel)              return { success: false, error: "Primary phone is required" };
  if (!pollingStationId) return { success: false, error: "Polling station is required" };

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
          (error: UploadApiErrorResponse | undefined, result: UploadApiResponse | undefined) => {
            if (error) reject(error);
            else if (result) resolve(result);
            else reject(new Error("Cloudinary upload returned no result"));
          }
        ).end(buffer);
      });

      imageUrl = result.secure_url;

      // Delete previous image if replacing
      const existing = await prisma.officials.findUnique({
        where: { userId },
        select: { image: true },
      });

      if (existing?.image) {
        const match = existing.image.match(/\/upload\/(?:v\d+\/)?(.+?)(?:\.[^.]+)?$/);
        if (match?.[1]) {
          await cloudinary.uploader.destroy(match[1]).catch(() => {});
        }
      }
    } catch (err) {
      console.error("Cloudinary upload failed:", err);
      return { success: false, error: "Failed to upload profile photo" };
    }
  } else {
    const existing = await prisma.officials.findUnique({
      where: { userId },
      select: { image: true },
    });

    if (!existing?.image) {
      return { success: false, error: "Profile photo is required (no existing photo found)" };
    }

    imageUrl = existing.image;
  }

  try {
    await prisma.officials.upsert({
      where: { userId },
      update: {
        fullName,
        designationId,
        tel,
        tel2,
        pollingStationId,
        image: imageUrl,
      },
      create: {
        userId,
        fullName,
        designationId,
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
    const official = await prisma.officials.findUnique({
      where: { userId },
      select: { image: true },
    });

    if (official?.image) {
      const match = official.image.match(/\/upload\/(?:v\d+\/)?(.+?)(?:\.[^.]+)?$/);
      if (match?.[1]) {
        await cloudinary.uploader.destroy(match[1]).catch(() => {});
      }
    }

    await prisma.officials.delete({ where: { userId } });
    revalidatePath("/team", "page");
    return { success: true };
  } catch (error) {
    console.error("Delete failed:", error);
    return { success: false, error: "Failed to delete official" };
  }
}

export async function addDesignationAction(formData: FormData): Promise<ActionResult> {
  const nameRaw        = formData.get("name") as string | null;
  const descriptionRaw = formData.get("description") as string | null;

  const name        = nameRaw?.trim() ?? "";
  const description = descriptionRaw?.trim() ?? "";

  if (!name) return { success: false, error: "Name is required" };

  try {
    await prisma.designation.create({
      data: {
        name,
        description: description || undefined,
      },
    });
    revalidatePath("/team");
    return { success: true };
  } catch (error) {
    console.error("Add designation failed:", error);
    return { success: false, error: "Failed to add designation" };
  }
}

export async function editDesignationAction(formData: FormData): Promise<ActionResult> {
  const idRaw          = formData.get("id") as string | null;
  const nameRaw        = formData.get("name") as string | null;
  const descriptionRaw = formData.get("description") as string | null;

  const id          = idRaw?.trim() ?? "";
  const name        = nameRaw?.trim() ?? "";
  const description = descriptionRaw?.trim() ?? "";

  if (!id || !name) return { success: false, error: "ID and name are required" };

  try {
    await prisma.designation.update({
      where: { id },
      data: {
        name,
        description: description || undefined,
      },
    });
    revalidatePath("/team");
    return { success: true };
  } catch (error) {
    console.error("Edit designation failed:", error);
    return { success: false, error: "Failed to update designation" };
  }
}

export async function deleteDesignationAction(formData: FormData): Promise<ActionResult> {
  const id = (formData.get("id") as string | null)?.trim() ?? "";

  if (!id) return { success: false, error: "ID required" };

  try {
    await prisma.designation.delete({ where: { id } });
    revalidatePath("/team");
    return { success: true };
  } catch (error) {
    console.error("Delete designation failed:", error);
    return { success: false, error: "Failed to delete designation (may be in use)" };
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