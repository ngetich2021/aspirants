"use server";

import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function saveExpenseAction(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  const userId = session.user.id;

  const expenseId = formData.get("expenseId")?.toString() || null;
  const describe  = formData.get("describe")?.toString().trim() || "";
  const amountStr = formData.get("amount")?.toString().trim() || "";

  if (!describe || !amountStr) {
    return { error: "Description and amount are required." };
  }

  const amount = Number(amountStr);
  if (isNaN(amount) || amount <= 0) {
    return { error: "Amount must be a positive number" };
  }

  try {
    if (expenseId) {
      const existing = await prisma.expense.findUnique({
        where: { id: expenseId },
        select: { addedById: true },
      });

      if (!existing) return { error: "Expense not found" };
      if (existing.addedById !== userId) {
        return { error: "You can only edit your own expenses." };
      }

      await prisma.expense.update({
        where: { id: expenseId },
        data: {
          describe,
          amount,
        },
      });
    } else {
      await prisma.expense.create({
        data: {
          describe,
          amount,
          addedById: userId,
        },
      });
    }

    revalidatePath("/expenses");
    return { success: true };
  } catch (error) {
    console.error("Save expense error:", error);
    return {
      error: expenseId ? "Failed to update expense." : "Failed to add expense.",
    };
  }
}

export async function deleteExpenseAction(expenseId: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const userId = session.user.id;

  const expense = await prisma.expense.findUnique({
    where: { id: expenseId },
    select: { addedById: true },
  });

  if (!expense) throw new Error("Expense not found");
  if (expense.addedById !== userId) {
    throw new Error("You can only delete your own expenses.");
  }

  await prisma.expense.delete({ where: { id: expenseId } });
  revalidatePath("/expenses");
}