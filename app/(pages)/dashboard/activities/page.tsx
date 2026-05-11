import { auth } from "@/auth";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { hasAccess } from "@/lib/rbac";
import { Suspense } from "react";
import ActivitiesClient from "./_components/ActivitiesClient";

export const revalidate = 1;

export default async function ActivitiesPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; limit?: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/");
  if (!hasAccess("activities", session.user.adminRole ?? "user", session.user.permissions ?? null))
    redirect("/dashboard/aspirants");

  const sp = await searchParams;
  const page = Number(sp.page) || 1;
  const limitOptions = [20, 50, 100, 250, 500, 1000, 5000];
  const limit = limitOptions.includes(Number(sp.limit)) ? Number(sp.limit) : 50;
  const skip = (page - 1) * limit;

  // Activities are campaign-wide, visible to all admins
  // Future: can add county-level activity tagging
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
    prisma.profile.findMany({
      select: { fullName: true },
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
        officials={officials.map((o) => o.fullName || "")}
      />
    </Suspense>
  );
}
