"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { v2 as cloudinary } from "cloudinary";
import type { UploadApiResponse } from "cloudinary";
import { auth } from "@/auth"; // ← import from your auth.ts file

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
  api_key: process.env.CLOUDINARY_API_KEY!,
  api_secret: process.env.CLOUDINARY_API_SECRET!,
});

type ActionResult =
  | { success: true }
  | { error: string };

async function requireUserId(): Promise<string> {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized - you must be signed in");
  }
  return session.user.id;
}

async function uploadImage(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  return new Promise<string>((resolve, reject) => {
    cloudinary.uploader
      .upload_stream(
        {
          folder: "activities",
          resource_type: "image",
        },
        (error, result) => {
          if (error) return reject(error);
          if (!result?.secure_url) return reject(new Error("Upload succeeded but no secure_url"));
          resolve(result.secure_url);
        }
      )
      .end(buffer);
  });
}

export async function saveActivityAction(formData: FormData): Promise<ActionResult> {
  let currentUserId: string;

  try {
    currentUserId = await requireUserId();
  } catch (err) {
    return { error: (err as Error).message || "Authentication required" };
  }

  const activityId   = formData.get("activityId")?.toString() ?? null;
  const name         = (formData.get("name")        ?.toString() ?? "").trim();
  const description  = (formData.get("description") ?.toString() ?? "").trim();
  const supervisor   = (formData.get("supervisor")  ?.toString() ?? "").trim();
  const status       = (formData.get("status")      ?.toString() ?? "pending").trim();
  const imageFile    = formData.get("image") as File | null;

  if (!name || !description || !supervisor) {
    return { error: "Name, description, and supervisor are required" };
  }

  let imageUrl: string | null = null;

  if (imageFile && imageFile.size > 0) {
    try {
      imageUrl = await uploadImage(imageFile);
    } catch (err) {
      console.error("Image upload error:", err);
      return { error: "Failed to upload image" };
    }
  }

  try {
    if (activityId) {
      // Update — we don't change addedById
      await prisma.activity.update({
        where: { id: activityId },
        data: {
          name,
          description,
          supervisor,
          status,
          ...(imageUrl !== null && { image: imageUrl }),
        },
      });
    } else {
      // Create
      if (!imageUrl) {
        return { error: "Image is required for new activities" };
      }

      await prisma.activity.create({
        data: {
          name,
          description,
          supervisor,
          status,
          image: imageUrl,
          addedById: currentUserId,
        },
      });
    }

    revalidatePath("/activities");
    return { success: true };
  } catch (err) {
    console.error("Activity save failed:", err);
    return { error: "Could not save activity" };
  }
}

export async function deleteActivityAction(id: string): Promise<ActionResult> {
  let currentUserId: string;

  try {
    currentUserId = await requireUserId();
  } catch (err) {
    return { error: (err as Error).message || "Authentication required" };
  }

  try {
    // Optional strict ownership check (uncomment if desired)
    /*
    const activity = await prisma.activity.findUnique({
      where: { id },
      select: { addedById: true },
    });

    if (!activity) {
      return { error: "Activity not found" };
    }

    if (activity.addedById !== currentUserId) {
      return { error: "You can only delete your own activities" };
    }
    */

    await prisma.activity.delete({ where: { id } });
    revalidatePath("/activities");
    return { success: true };
  } catch (err) {
    console.error("Activity delete failed:", err);
    return { error: "Could not delete activity" };
  }
}