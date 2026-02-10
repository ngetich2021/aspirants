"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function saveAspirantAction(formData: FormData) {
  const aspirantId       = formData.get("aspirantId")?.toString() || null;
  const fullName         = formData.get("fullName")?.toString().trim() || "";
  const tel              = formData.get("tel")?.toString().trim() || "";
  const position         = formData.get("position")?.toString().trim() || "";
  const pollingStationId = formData.get("pollingStationId")?.toString().trim() || "";

  if (!fullName || !tel || !position || !pollingStationId) {
    return { error: "All fields are required: full name, telephone, position, and polling station." };
  }

  try {
    if (aspirantId) {
      // Update
      await prisma.aspirant.update({
        where: { id: aspirantId },
        data: {
          fullName,
          tel,
          position,
          pollingStationId,
        },
      });
    } else {
      return { error: "Addition is disabled." };
    }

    revalidatePath("/aspirants");
    return { success: true };
  } catch (error) {
    console.error("Save aspirant error:", error);
    if (error instanceof Error && error.message.includes("Unique constraint")) {
      return { error: "This telephone number is already in use." };
    }
    return { error: aspirantId ? "Failed to update aspirant." : "Failed to save aspirant." };
  }
}

export async function deleteAspirantAction(aspirantId: string) {
  try {
    await prisma.aspirant.delete({ where: { id: aspirantId } });
    revalidatePath("/aspirants");
  } catch (error) {
    console.error("Delete aspirant error:", error);
    throw new Error("Failed to delete aspirant.");
  }
}