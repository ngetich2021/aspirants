import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import ExpensesClient from "./_components/ExpensesClient";

export const revalidate = 1;

export default async function ExpensesPage() {
  const session = await auth();
  if (!session?.user?.id) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <p className="text-xl text-gray-700">Please sign in to view expenses.</p>
      </div>
    );
  }

  const userId = session.user.id;

  // Fetch user role
  const userProfile = await prisma.profile.findUnique({
    where: { userId },
    select: { role: true },
  });

  const userRole = (userProfile?.role || "").toLowerCase().trim();
  const isAdminOrLeader = ["admin", "leader"].includes(userRole);

  const expenses = await prisma.expense.findMany({
    where: isAdminOrLeader ? {} : { addedById: userId },
    select: {
      id: true,
      describe: true,
      amount: true,
      createdAt: true,
      // Show who created it (only useful for admins/leaders)
      user: {
        select: {
          name: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);

  return (
    <ExpensesClient
      totalExpenses={totalExpenses}
      initialExpenses={expenses}
      isPrivileged={isAdminOrLeader}
    />
  );
}