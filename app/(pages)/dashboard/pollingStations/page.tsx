import prisma from "@/lib/prisma";
import PollingStationsClient from "./_components/PollingStationsClient";

export const revalidate = 1;

export default async function PollingStationsPage() {
  const stations = await prisma.pollingStation.findMany({
    select: {
      id: true,
      county:true,
      subCounty:true,
      name: true,
      ward: true,
      votes: true,
    },
    orderBy: { id: "asc" },
  });

  return (
    <PollingStationsClient
      totalStations={stations.length}
      initialStations={stations}
    />
  );
}