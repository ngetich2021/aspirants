import prisma from "@/lib/prisma";
import TeamClient from "./_components/TeamClient";
import { getUsersStationsDesignations } from "./_components/actionsTeam";

export const revalidate = 10;

export default async function TeamPage() {
  const { users, stations, designations } = await getUsersStationsDesignations();

  const usersWithEmail = users.filter(
    (u): u is { id: string; email: string; name: string | null } => !!u.email
  );

  const officials = await prisma.profile.findMany({
    where: {
      role: { not: null },     // all people who have a designation/role
      // You can make it more specific if needed:
      // role: { in: ["leader", "coordinator", "supervisor"] }
    },
    include: {
      user:          { select: { email: true } },
      pollingStation: { select: { name: true } },
      designation:   { select: { name: true } },
    },
    orderBy: { fullName: "asc" },
  });

  const initialOfficials = officials.map((o) => ({
    userId:       o.userId,
    fullName:     o.fullName,
    email:        o.user?.email ?? null,
    designation:  o.designation?.name ?? null,
    designationId: o.designationId,
    tel:          o.tel,
    tel2:         o.tel2,
    stationId:    o.pollingStationId,
    stationName:  o.pollingStation?.name ?? null,
    image:        o.image,
  }));

  return (
    <TeamClient
      initialUsers={usersWithEmail}
      initialStations={stations}
      initialDesignations={designations}
      initialOfficials={initialOfficials}
      initialCount={initialOfficials.length}
    />
  );
}