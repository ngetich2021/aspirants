"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { v2 as cloudinary } from "cloudinary";
import type { UploadApiResponse } from "cloudinary";
import { auth } from "@/auth";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
  api_key: process.env.CLOUDINARY_API_KEY!,
  api_secret: process.env.CLOUDINARY_API_SECRET!,
});

export type ActionResult =
  | { success: true }
  | { success: false; error: string };

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
        { folder: "activities", resource_type: "image" },
        (error, result) => {
          if (error) return reject(error);
          if (!result?.secure_url) return reject(new Error("No secure_url"));
          resolve(result.secure_url);
        }
      )
      .end(buffer);
  });
}

// Activity Actions
export async function saveActivityAction(formData: FormData): Promise<ActionResult> {
  let currentUserId: string;
  try {
    currentUserId = await requireUserId();
  } catch (err) {
    return { success: false, error: (err as Error).message || "Authentication required" };
  }

  const activityId   = formData.get("activityId")?.toString() ?? null;
  const name         = (formData.get("name")?.toString() ?? "").trim();
  const description  = (formData.get("description")?.toString() ?? "").trim();
  const supervisor   = (formData.get("supervisor")?.toString() ?? "").trim();
  const status       = (formData.get("status")?.toString() ?? "pending").trim();
  const imageEntry   = formData.get("image");

  if (!name || !description || !supervisor) {
    return { success: false, error: "Name, description, and supervisor are required" };
  }

  let imageUrl: string | null = null;

  // Proper file check
  if (imageEntry instanceof File && imageEntry.size > 0) {
    try {
      imageUrl = await uploadImage(imageEntry);
    } catch (err) {
      console.error("Image upload error:", err);
      return { success: false, error: "Failed to upload image" };
    }
  }

  try {
    if (activityId) {
      // Update
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
        return { success: false, error: "Image is required for new activities" };
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
    return { success: false, error: "Could not save activity" };
  }
}

export async function deleteActivityAction(id: string): Promise<ActionResult> {
  try {
    await requireUserId();
  } catch (err) {
    return { success: false, error: (err as Error).message || "Authentication required" };
  }

  try {
    await prisma.activity.delete({ where: { id } });
    revalidatePath("/activities");
    return { success: true };
  } catch (err) {
    console.error("Activity delete failed:", err);
    return { success: false, error: "Could not delete activity" };
  }
}

// Report Actions (unchanged — already safe)
export async function saveReportAction(formData: FormData): Promise<ActionResult> {
  try {
    await requireUserId();
  } catch (err) {
    return { success: false, error: (err as Error).message || "Authentication required" };
  }

  const activityId = formData.get("activityId")?.toString();
  const reportText = (formData.get("report")?.toString() ?? "").trim();

  if (!activityId || !reportText) {
    return { success: false, error: "Activity ID and report text are required" };
  }

  try {
    await prisma.report.create({
      data: { report: reportText, activityId },
    });
    revalidatePath("/activities");
    return { success: true };
  } catch (err) {
    console.error("Report save failed:", err);
    return { success: false, error: "Could not save report" };
  }
}

export async function deleteReportAction(reportId: string): Promise<ActionResult> {
  try {
    await requireUserId();
  } catch (err) {
    return { success: false, error: (err as Error).message || "Authentication required" };
  }

  try {
    await prisma.report.delete({ where: { id: reportId } });
    revalidatePath("/activities");
    return { success: true };
  } catch (err) {
    console.error("Report delete failed:", err);
    return { success: false, error: "Could not delete report" };
  }
}

export async function getReportsForActivity(activityId: string) {
  return prisma.report.findMany({
    where: { activityId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      report: true,
      createdAt: true,
    },
  });
}