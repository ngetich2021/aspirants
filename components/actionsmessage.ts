"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function sendMessageAction(formData: FormData) {
  const name = formData.get("name")?.toString().trim();
  const tel = formData.get("tel")?.toString().trim();
  const pollingStation = formData.get("pollingStation")?.toString().trim();
  const message = formData.get("message")?.toString().trim();

  if (!name || !tel || !pollingStation || !message) {
    return { error: "Please fill in all fields." };
  }

  try {
    await prisma.message.create({
      data: { name, tel, pollingStation, message },
    });

    revalidatePath("/"); // Adjust path as needed
    return { success: "Message sent successfully!" };
  } catch (error) {
    console.error("Message Error:", error);
    return { error: "Something went wrong. Please try again." };
  }
}