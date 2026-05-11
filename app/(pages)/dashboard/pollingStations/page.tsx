import { auth } from "@/auth";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { getPollingStationWhere, hasAccess } from "@/lib/rbac";
import type { AdminRole } from "@/lib/rbac";
import PollingStationsClient from "./_components/PollingStationsClient";

export const revalidate = 1;

export default async function PollingStationsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/");
  if (!hasAccess("pollingStations", session.user.adminRole ?? "user", session.user.permissions ?? null))
    redirect("/dashboard/aspirants");

  const adminRole = (session.user.adminRole || "user") as AdminRole;
  const scope = {
    adminCounty: session.user.adminCounty,
    adminSubCounty: session.user.adminSubCounty,
    adminWard: session.user.adminWard,
    pollingStationId: session.user.pollingStationId,
  };

  const isAdmin = ["super_admin","county_admin","subcounty_admin","ward_admin","pollingstation_admin"].includes(adminRole);

  const where = getPollingStationWhere(adminRole, scope);

  const stations = await prisma.pollingStation.findMany({
    where,
    select: {
      id: true,
      name: true,
      ward: true,
      county: true,
      subCounty: true,
      votes: true,
      _count: { select: { aspirants: true } },
      profiles: {
        select: { userId: true, fullName: true, tel: true, adminRole: true },
      },
    },
    orderBy: { name: "asc" },
  });

  const formatted = stations.map((st) => ({
    id: st.id,
    name: st.name,
    ward: st.ward,
    county: st.county,
    subCounty: st.subCounty,
    votes: st.votes,
    aspirantsCount: st._count.aspirants,
  }));

  // Build profiles map keyed by stationId
  const profilesMap: Record<string, { userId: string; fullName: string | null; tel: string | null; adminRole: string | null }[]> = {};
  for (const st of stations) {
    profilesMap[st.id] = st.profiles;
  }

  return (
    <PollingStationsClient
      totalStations={formatted.length}
      initialStations={formatted}
      isAdmin={isAdmin}
      profiles={profilesMap}
    />
  );
}
