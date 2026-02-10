import prisma from "@/lib/prisma";
import TeamClient from "./_components/TeamClient";
import { getUsersStationsDesignations } from "./_components/actionsTeam";

export const revalidate = 3;

export default async function TeamPage() {
  const { users, stations, designations } = await getUsersStationsDesignations();

  // Filter + narrow type so email is string (non-null)
  const usersWithEmail = users.filter((user): user is { id: string; name: string | null; email: string } =>
    user.email !== null
  );

  const officials = await prisma.officials.findMany({
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
  stationName:  o.pollingStation?.name ?? o.pollingStationId,
  image:        o.image,                    // ← MUST be here
}));

  return (
    <TeamClient
      initialUsers={usersWithEmail}           // ← now TS sees email: string
      initialStations={stations}
      initialDesignations={designations}
      initialOfficials={initialOfficials}
      initialCount={initialOfficials.length}
    />
  );
}