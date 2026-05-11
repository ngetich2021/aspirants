import { auth } from "@/auth";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { getPollingStationWhere, hasAccess } from "@/lib/rbac";
import type { AdminRole } from "@/lib/rbac";
import ExpensesClient from "./_components/ExpensesClient";

export const revalidate = 1;

export default async function ExpensesPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/");
  if (!hasAccess("expenses", session.user.adminRole ?? "user", session.user.permissions ?? null))
    redirect("/dashboard/aspirants");

  const userId = session.user.id;
  const adminRole = (session.user.adminRole || "user") as AdminRole;
  const scope = {
    adminCounty: session.user.adminCounty,
    adminSubCounty: session.user.adminSubCounty,
    adminWard: session.user.adminWard,
    pollingStationId: session.user.pollingStationId,
  };

  const isSuperAdmin = adminRole === "super_admin";
  const isScopedAdmin = ["county_admin", "subcounty_admin", "ward_admin", "pollingstation_admin"].includes(adminRole);
  const isPrivileged = isSuperAdmin || isScopedAdmin;

  let expenseWhere = {};

  if (isSuperAdmin) {
    // All expenses
    expenseWhere = {};
  } else if (isScopedAdmin) {
    // Expenses from users within the admin's geographic scope
    const stationWhere = getPollingStationWhere(adminRole, scope);
    const stationsInScope = await prisma.pollingStation.findMany({
      where: stationWhere,
      select: { id: true },
    });
    const stationIds = stationsInScope.map((s) => s.id);

    // Users whose profile polling station is in scope
    const profilesInScope = await prisma.profile.findMany({
      where: { pollingStationId: { in: stationIds } },
      select: { userId: true },
    });
    const userIdsInScope = profilesInScope.map((p) => p.userId);

    expenseWhere = { addedById: { in: userIdsInScope } };
  } else {
    // Regular user: only own expenses
    expenseWhere = { addedById: userId };
  }

  const expenses = await prisma.expense.findMany({
    where: expenseWhere,
    select: {
      id: true,
      describe: true,
      amount: true,
      createdAt: true,
      user: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);

  return (
    <ExpensesClient
      totalExpenses={totalExpenses}
      initialExpenses={expenses}
      isPrivileged={isPrivileged}
    />
  );
}
