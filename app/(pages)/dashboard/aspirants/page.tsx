import { auth } from "@/auth";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { getPollingStationWhere } from "@/lib/rbac";
import type { AdminRole } from "@/lib/rbac";
import AspirantsClient from "./_components/AspirantsClient";
import { Suspense } from "react";

export const revalidate = 1;

export default async function AspirantsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; limit?: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/");

  const params = await searchParams;
  const page = Math.max(1, Number(params.page) || 1);
  const limitOptions = [20, 50, 100, 250, 500, 1000, 5000];
  const limit = limitOptions.includes(Number(params.limit)) ? Number(params.limit) : 50;
  const skip = (page - 1) * limit;

  const adminRole = (session.user.adminRole || "user") as AdminRole;
  const scope = {
    adminCounty: session.user.adminCounty,
    adminSubCounty: session.user.adminSubCounty,
    adminWard: session.user.adminWard,
    pollingStationId: session.user.pollingStationId,
  };

  // Build pollingStation filter for scoped admins
  const stationWhere = getPollingStationWhere(adminRole, scope);
  const isScoped = adminRole !== "super_admin" && adminRole !== "user";

  let aspirantWhere = {};
  if (isScoped) {
    const stationsInScope = await prisma.pollingStation.findMany({
      where: stationWhere,
      select: { id: true },
    });
    const ids = stationsInScope.map((s) => s.id);
    aspirantWhere = { pollingStationId: { in: ids } };
  }

  const [aspirants, totalAspirants] = await Promise.all([
    prisma.aspirant.findMany({
      where: aspirantWhere,
      select: {
        id: true,
        fullName: true,
        tel: true,
        position: true,
        pollingStationId: true,
        pollingStation: { select: { name: true } },
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
      take: limit,
      skip,
    }),
    prisma.aspirant.count({ where: aspirantWhere }),
  ]);

  // Lookup adminRole by tel from Profile
  const tels = aspirants.map((a) => a.tel);
  const profilesByTel = tels.length > 0
    ? await prisma.profile.findMany({
        where: { tel: { in: tels } },
        select: { tel: true, adminRole: true },
      })
    : [];
  const roleMap = new Map(profilesByTel.map((p) => [p.tel, p.adminRole ?? "user"]));

  const aspirantsWithRole = aspirants.map((a) => ({
    ...a,
    adminRole: roleMap.get(a.tel) ?? null,
  }));

  const totalPages = Math.ceil(totalAspirants / limit);

  return (
    <Suspense fallback={<div>Loading voters...</div>}>
      <AspirantsClient
        initialAspirants={aspirantsWithRole}
        totalAspirants={totalAspirants}
        currentPage={page}
        totalPages={totalPages}
        limit={limit}
      />
    </Suspense>
  );
}
