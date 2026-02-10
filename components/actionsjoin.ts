"use server";
import prisma from "@/lib/prisma";

// Define a strict return type
export type ActionResponse = {
  error?: string;
  success?: string;
};

export async function joinUsAction(formData: FormData): Promise<ActionResponse> {
  try {
    const fullName = formData.get("fullName") as string;
    const tel = formData.get("tel") as string;
    const pollingStationId = formData.get("pollingStationId") as string;
    const position = formData.get("position") as string;

    if (!fullName || !tel || !pollingStationId) {
      return { error: "Required fields are missing." };
    }

    await prisma.aspirant.create({
      data: {
        fullName,
        tel,
        pollingStationId,
        position,
      },
    });

    return { success: "Registration successful!" };
  } catch (error: unknown) {
    // Check for Prisma unique constraint error (P2002) without using 'any'
    if (typeof error === 'object' && error !== null && 'code' in error) {
      if ((error as { code: string }).code === 'P2002') {
        return { error: "Phone number already exists." };
      }
    }
    return { error: "Server error. Please try again." };
  }
}