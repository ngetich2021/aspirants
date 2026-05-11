'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useTransition, useMemo } from 'react';
import { markMessageRead } from '@/components/actionsmessage';

type MessageItem = {
  id: string;
  name: string;
  tel: string;
  pollingStation: string;
  createdAt: string;
  message: string;
  readAt: string | null;
};

const pageSizeOptions = [20, 50, 100, 200, 500, 1000, 5000];

interface Props {
  initialMessages: MessageItem[];
  total: number;
  currentPage: number;
  pageSize: number;
}

export default function MessagesClient({
  initialMessages,
  total,
  currentPage,
  pageSize,
}: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [openMessageId, setOpenMessageId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Optimistic read tracking — seeded from DB state, updated on click
  const [readIds, setReadIds] = useState<Set<string>>(
    () => new Set(initialMessages.filter((m) => m.readAt).map((m) => m.id))
  );

  const updateUrl = (newParams: Record<string, string>) => {
    const params = new URLSearchParams(searchParams);
    Object.entries(newParams).forEach(([k, v]) => {
      if (v) params.set(k, v);
      else params.delete(k);
    });
    startTransition(() => {
      router.replace(`?${params.toString()}`, { scroll: false });
    });
  };

  const handleReadClick = (id: string) => {
    setOpenMessageId(openMessageId === id ? null : id);

    if (!readIds.has(id)) {
      setReadIds((prev) => new Set(prev).add(id));
      markMessageRead(id).catch(console.error);
    }
  };

  const handlePageSizeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    updateUrl({ size: e.target.value, page: '1' });
  };

  const handlePageChange = (delta: number) => {
    const next = currentPage + delta;
    if (next < 1) return;
    updateUrl({ page: next.toString() });
  };

  const filtered = useMemo(() => {
    const base = searchQuery.trim()
      ? (() => {
          const q = searchQuery.toLowerCase().trim();
          return initialMessages.filter(
            (m) =>
              m.name.toLowerCase().includes(q) ||
              m.tel.includes(q) ||
              m.pollingStation.toLowerCase().includes(q) ||
              m.message.toLowerCase().includes(q)
          );
        })()
      : initialMessages;

    // Unread first, read pushed to bottom; within each group preserve original order
    return [...base].sort((a, b) => {
      const aRead = readIds.has(a.id) ? 1 : 0;
      const bRead = readIds.has(b.id) ? 1 : 0;
      return aRead - bRead;
    });
  }, [initialMessages, searchQuery, readIds]);

  const showingFrom = (currentPage - 1) * pageSize + 1;
  const showingTo = Math.min(showingFrom + filtered.length - 1, total);

  return (
    <main className="min-h-screen bg-gray-100">
      <div className="max-w-6xl mx-auto px-3 sm:px-6 py-6">
        <div className="bg-white border border-gray-300 rounded shadow-sm overflow-hidden">

          {/* Top controls */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 p-4 border-b bg-gray-50">
            <div className="bg-red-600 text-white px-4 py-2 rounded font-medium text-lg inline-block">
              Total messages {total.toLocaleString()}
            </div>

            <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
              <div className="relative flex-1 min-w-[240px]">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search name, phone, station, message..."
                  className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500"
                />
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>

              <div className="flex items-center gap-2 whitespace-nowrap">
                <span className="text-sm text-gray-700">Show:</span>
                <select
                  value={pageSize}
                  onChange={handlePageSizeChange}
                  disabled={isPending}
                  className="border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-green-500"
                >
                  {pageSizeOptions.map((n) => (
                    <option key={n} value={n}>{n}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-200 text-gray-700 uppercase text-xs">
                <tr>
                  <th className="px-4 py-3">S/NO</th>
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Polling Station</th>
                  <th className="px-4 py-3">Tel</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                      {searchQuery ? 'No matching messages found' : 'No messages to display'}
                    </td>
                  </tr>
                ) : (
                  filtered.map((msg, idx) => {
                    const serial = searchQuery ? idx + 1 : showingFrom + idx;
                    const isRead = readIds.has(msg.id);

                    return (
                      <tr
                        key={msg.id}
                        className={`border-b align-top transition-colors ${
                          isRead ? 'bg-gray-50 text-gray-400' : 'hover:bg-gray-50'
                        }`}
                      >
                        <td className="px-4 py-3">{serial}</td>
                        <td className="px-4 py-3">{msg.name}</td>
                        <td className="px-4 py-3">{msg.pollingStation}</td>
                        <td className="px-4 py-3 font-mono">{msg.tel}</td>
                        <td className="px-4 py-3">{msg.createdAt}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleReadClick(msg.id)}
                              className={`font-medium transition-colors ${
                                isRead
                                  ? 'text-gray-400 hover:text-gray-600'
                                  : 'text-green-600 hover:text-green-800'
                              }`}
                            >
                              {isRead ? 'view' : 'read'}
                            </button>
                            {isRead && (
                              <span className="text-xs text-gray-400 italic">already read</span>
                            )}
                          </div>

                          {openMessageId === msg.id && (
                            <div className="mt-2 p-3 bg-white border border-gray-200 rounded text-gray-700 text-sm max-w-xs sm:max-w-md shadow-sm">
                              <div className="font-medium mb-1 text-gray-600">
                                From: {msg.name} • {msg.tel}
                              </div>
                              <p className="whitespace-pre-wrap">{msg.message}</p>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {!searchQuery && (
            <div className="flex justify-between items-center px-4 py-3 bg-gray-50 border-t text-sm">
              <div className="text-gray-600">
                Showing {showingFrom}–{showingTo} of {total}
              </div>
              <div className="flex gap-2">
                <button
                  disabled={currentPage <= 1 || isPending}
                  onClick={() => handlePageChange(-1)}
                  className="px-4 py-1.5 border rounded disabled:opacity-40 hover:bg-gray-100"
                >
                  Prev
                </button>
                <button
                  disabled={showingTo >= total || isPending}
                  onClick={() => handlePageChange(1)}
                  className="px-4 py-1.5 border rounded disabled:opacity-40 hover:bg-gray-100"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
