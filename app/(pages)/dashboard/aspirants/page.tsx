// app/(pages)/dashboard/aspirants/page.tsx
import prisma from "@/lib/prisma";
import AspirantsClient from "./_components/AspirantsClient";
import { Suspense } from "react";

export const revalidate = 1; // or 30 / 60 / whatever makes sense for your use-case

export default async function AspirantsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; limit?: string }>;
}) {
  // Await the promise – this is required in Next.js 15+
  const params = await searchParams;

  // Parse pagination values safely
  const page = Math.max(1, Number(params.page) || 1);

  const limitOptions = [20, 50, 100, 250, 500, 1000, 5000];
  const limit = limitOptions.includes(Number(params.limit))
    ? Number(params.limit)
    : 50;

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