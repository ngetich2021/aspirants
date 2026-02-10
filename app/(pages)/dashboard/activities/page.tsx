import prisma from "@/lib/prisma";
import { Suspense } from "react";
import ActivitiesClient from "./_components/ActivitiesClient";

export const revalidate = 30;

export default async function ActivitiesPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; limit?: string }>;
}) {
  const sp = await searchParams;

  const page = Number(sp.page) || 1;

  const limitOptions = [20, 50, 100, 250, 500, 1000, 5000];
  const limit = limitOptions.includes(Number(sp.limit))
    ? Number(sp.limit)
    : 50;

  const skip = (page - 1) * limit;

  const [activities, totalActivities, officials] = await Promise.all([
    prisma.activity.findMany({
      select: {
        id: true,
        name: true,
        description: true,
        supervisor: true,
        status: true,
        image: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
      take: limit,
      skip,
    }),

    prisma.activity.count(),

    prisma.officials.findMany({
      select: {
        fullName: true,
      },
      orderBy: { fullName: "asc" },
    }),
  ]);

  const totalPages = Math.ceil(totalActivities / limit);

  return (
    <Suspense fallback={<div>Loading activities...</div>}>
      <ActivitiesClient
        initialActivities={activities}
        totalActivities={totalActivities}
        currentPage={page}
        totalPages={totalPages}
        limit={limit}
        officials={officials.map((o) => o.fullName)}
      />
    </Suspense>
  );
}