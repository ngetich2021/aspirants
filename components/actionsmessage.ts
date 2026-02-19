"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function sendMessageAction(formData: FormData) {
  // Extract and clean data
  const name = formData.get("name")?.toString().trim();
  const tel = formData.get("tel")?.toString().trim();
  const pollingStation = formData.get("pollingStation")?.toString().trim();
  const message = formData.get("message")?.toString().trim();

  // Validation
  if (!name || !tel || !pollingStation || !message) {
    return { error: "Please fill in all fields." };
  }

  try {
    // Create the record in Prisma
    await prisma.message.create({
      data: { name, tel, pollingStation, message },
    });

    revalidatePath("/"); 
    return { success: "Message sent successfully!" };
  } catch (error) {
    console.error("Database Error:", error);
    return { error: "Failed to save message. Please try again." };
  }
}