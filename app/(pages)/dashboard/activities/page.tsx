import prisma from "@/lib/prisma";
import { Suspense } from "react";
import ActivitiesClient from "./_components/ActivitiesClient";

export const revalidate = 30;

interface ActivitiesPageProps {
  searchParams: { 
    page?: string;
    limit?: string;
  };
}

export default async function ActivitiesPage({ searchParams }: ActivitiesPageProps) {
  const page = Number(searchParams.page) || 1;
  const limitOptions = [20, 50, 100, 250, 500, 1000, 5000];
  const limit = limitOptions.includes(Number(searchParams.limit))
    ? Number(searchParams.limit)
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