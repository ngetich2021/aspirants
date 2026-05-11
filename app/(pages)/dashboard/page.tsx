import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getPollingStationWhere, hasAccess } from "@/lib/rbac";
import type { AdminRole } from "@/lib/rbac";
import MessagesClient from "./_components/MessagesClient";

export const revalidate = 1;

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; size?: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/");
  if (!hasAccess("messages", session.user.adminRole ?? "user", session.user.permissions ?? null))
    redirect("/dashboard/aspirants");

  const params = await searchParams;
  const page = Math.max(1, Number(params.page) || 1);
  const sizeOptions = [20, 50, 100, 200, 500, 1000, 5000];
  const size = sizeOptions.includes(Number(params.size)) ? Number(params.size) : 20;
  const skip = (page - 1) * size;

  const adminRole = (session.user.adminRole || "user") as AdminRole;
  const scope = {
    adminCounty: session.user.adminCounty,
    adminSubCounty: session.user.adminSubCounty,
    adminWard: session.user.adminWard,
    pollingStationId: session.user.pollingStationId,
  };

  // For scoped admins, get the polling station names in their scope and filter messages
  let messageWhere = {};
  if (adminRole !== "super_admin" && adminRole !== "user") {
    const stationWhere = getPollingStationWhere(adminRole, scope);
    const stationsInScope = await prisma.pollingStation.findMany({
      where: stationWhere,
      select: { name: true },
    });
    const names = stationsInScope.map((s) => s.name);
    messageWhere = { pollingStation: { in: names } };
  }

  const [messages, totalCount] = await Promise.all([
    prisma.message.findMany({
      where: messageWhere,
      take: size,
      skip,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        tel: true,
        pollingStation: true,
        createdAt: true,
        message: true,
        readAt: true,
      },
    }),
    prisma.message.count({ where: messageWhere }),
  ]);

  const formattedMessages = messages.map((msg) => ({
    id: msg.id,
    name: msg.name,
    tel: msg.tel,
    pollingStation: msg.pollingStation,
    message: msg.message,
    createdAt: msg.createdAt.toISOString().split("T")[0],
    readAt: msg.readAt ? msg.readAt.toISOString() : null,
  }));

  return (
    <MessagesClient
      initialMessages={formattedMessages}
      total={totalCount}
      currentPage={page}
      pageSize={size}
    />
  );
}
