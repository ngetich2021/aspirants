// app/dashboard/page.tsx
import { prisma } from '@/lib/prisma'; // adjust path to your Prisma client
import MessagesClient from './_components/MessagesClient';

interface SearchParams {
  page?: string;
  size?: string;
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const page = Number(searchParams.page) || 1;
  const size = Number(searchParams.size) || 20;

  if (page < 1 || size < 1) {
    // You could redirect or show error — for simplicity we clamp
  }

  const [messages, total] = await Promise.all([
    prisma.message.findMany({
      take: size,
      skip: (page - 1) * size,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        tel: true,
        pollingStation: true,
        createdAt: true,
        message: true, // we send message content — only if dataset is small!
      },
    }),
    prisma.message.count(),
  ]);

  // Format dates for client (optional — can also do in client)
  const formattedMessages = messages.map((msg) => ({
    ...msg,
    createdAt: msg.createdAt.toISOString().split('T')[0], // or use date-fns/luxon
  }));

  return (
    <MessagesClient
      initialMessages={formattedMessages}
      total={total}
      currentPage={page}
      pageSize={size}
    />
  );
}