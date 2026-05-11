import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from '@/lib/prisma';
import { hasAccess } from "@/lib/rbac";
import DonationsClient from './_components/DonationsClient';

export const revalidate = 1;

async function getTotals() {
  const [fundsSum, giftsCount, agentsCount] = await Promise.all([
    prisma.funds.aggregate({ _sum: { amount: true } }),
    prisma.gifts.count(),
    prisma.agent.count(),
  ]);

  return {
    totalFunds: fundsSum._sum.amount ?? 0,
    totalGifts: giftsCount,
    totalAgents: agentsCount,
  };
}

async function getFunds() {
  return prisma.funds.findMany({
    select: {
      id: true,
      name: true,
      tel: true,
      amount: true,
    },
    orderBy: { createdAt: 'desc' },
  });
}

async function getGifts() {
  return prisma.gifts.findMany({
    select: {
      id: true,
      name: true,
      tel: true,
      describe: true,
    },
    orderBy: { createdAt: 'desc' },
  });
}

async function getAgents() {
  return prisma.agent.findMany({
    select: {
      id: true,
      fullName: true,
      tel: true,
      tel2: true,
      position: true,           // ← added
      pollingStation: { select: { name: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
}

export default async function DonationsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/");
  if (!hasAccess("donations", session.user.adminRole ?? "user", session.user.permissions ?? null))
    redirect("/dashboard/aspirants");

  const [totals, funds, gifts, agents] = await Promise.all([
    getTotals(),
    getFunds(),
    getGifts(),
    getAgents(),
  ]);

  return (
    <DonationsClient
      totals={totals}
      initialFunds={funds}
      initialGifts={gifts}
      initialAgents={agents}
    />
  );
}