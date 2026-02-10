// app/dashboard/page.tsx
import { prisma } from "@/lib/prisma";
import MessagesClient from "./_components/MessagesClient";

export const revalidate = 60; // Optional: revalidate every 60 seconds

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; size?: string }>;
}) {
  const params = await searchParams;

  // Parse and sanitize pagination params
  const page = Math.max(1, Number(params.page) || 1);
  const sizeOptions = [20, 50, 100, 200, 500, 1000, 5000];
  const size = sizeOptions.includes(Number(params.size))
    ? Number(params.size)
    : 20;

  const skip = (page - 1) * size;

  const [messages, totalCount] = await Promise.all([
    prisma.message.findMany({
      take: size,
      skip,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        tel: true,
        pollingStation: true,
        createdAt: true,
        message: true,
      },
    }),
    prisma.message.count(),
  ]);

  // Format dates once on the server (better consistency & performance)
  const formattedMessages = messages.map((msg) => ({
    id: msg.id,
    name: msg.name,
    tel: msg.tel,
    pollingStation: msg.pollingStation,
    message: msg.message,
    createdAt: msg.createdAt.toISOString().split("T")[0], // YYYY-MM-DD
  }));

  return (
    <MessagesClient
      initialMessages={formattedMessages}
      total={totalCount}
      currentPage={page}
      pageSize={size}
    />
  );
}