// app/polling-stations/page.tsx
import prisma from "@/lib/prisma";
import PollingStationsClient from "./_components/PollingStationsClient";

export const revalidate = 1;

export default async function PollingStationsPage() {
  const stations = await prisma.pollingStation.findMany({
    select: {
      id: true,
      name: true,
      ward: true,
      county: true,
      subCounty: true,
      votes: true,
      _count: {
        select: {
          aspirants: true,
        },
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

  return (
    <PollingStationsClient
      totalStations={formatted.length}
      initialStations={formatted}
    />
  );
}