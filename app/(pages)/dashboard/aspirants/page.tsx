import prisma from "@/lib/prisma";
import AspirantsClient from "./_components/AspirantsClient";
import { Suspense } from "react";

export const revalidate = 1;

interface AspirantsPageProps {
  searchParams: { 
    page?: string;
    limit?: string;
  };
}

export default async function AspirantsPage({ searchParams }: AspirantsPageProps) {
  const page = Number(searchParams.page) || 1;
  const limit = [20, 50, 100, 250, 500, 1000, 5000].includes(Number(searchParams.limit))
    ? Number(searchParams.limit)
    : 50; // default to 50

  const skip = (page - 1) * limit;

  const [aspirants, totalAspirants] = await Promise.all([
    prisma.aspirant.findMany({
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
    prisma.aspirant.count(),
  ]);

  const totalPages = Math.ceil(totalAspirants / limit);

  return (
    <Suspense fallback={<div>Loading aspirants...</div>}>
      <AspirantsClient
        initialAspirants={aspirants}
        totalAspirants={totalAspirants}
        currentPage={page}
        totalPages={totalPages}
        limit={limit}
      />
    </Suspense>
  );
}