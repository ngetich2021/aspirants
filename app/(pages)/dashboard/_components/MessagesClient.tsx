// app/dashboard/MessagesClient.tsx
'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useTransition, useMemo } from 'react';

type MessageItem = {
  id: string;
  name: string;
  tel: string;
  pollingStation: string;
  createdAt: string;   // formatted date string
  message: string;
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

  const handlePageSizeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    updateUrl({ size: e.target.value, page: '1' });
  };

  const handlePageChange = (delta: number) => {
    const next = currentPage + delta;
    if (next < 1) return;
    updateUrl({ page: next.toString() });
  };

  // Client-side search filter
  const filtered = useMemo(() => {
    if (!searchQuery.trim()) return initialMessages;

    const q = searchQuery.toLowerCase().trim();

    return initialMessages.filter(m =>
      m.name.toLowerCase().includes(q) ||
      m.tel.includes(q) ||
      m.pollingStation.toLowerCase().includes(q) ||
      m.message.toLowerCase().includes(q)
    );
  }, [initialMessages, searchQuery]);

  const showingFrom = (currentPage - 1) * pageSize + 1;
  const showingTo   = Math.min(showingFrom + filtered.length - 1, total);

  return (
    <main className="min-h-screen bg-gray-100">
      <div className="max-w-6xl mx-auto px-3 sm:px-6 py-6">
        <div className="bg-white border border-gray-300 rounded shadow-sm overflow-hidden">

          {/* Top controls: Total + search + page size */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 p-4 border-b bg-gray-50">
            <div className="bg-red-600 text-white px-4 py-2 rounded font-medium text-lg inline-block">
              Total messages {total.toLocaleString()}
            </div>

            <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
              {/* Search */}
              <div className="relative flex-1 min-w-[240px]">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search name, phone, station, message..."
                  className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500"
                />
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>

              {/* Page size dropdown */}
              <div className="flex items-center gap-2 whitespace-nowrap">
                <span className="text-sm text-gray-700">Show:</span>
                <select
                  value={pageSize}
                  onChange={handlePageSizeChange}
                  disabled={isPending}
                  className="border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-green-500"
                >
                  {pageSizeOptions.map(n => (
                    <option key={n} value={n}>{n}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-200 text-gray-700 uppercase text-xs">
                <tr>
                  <th className="px-4 py-3">S/NO</th>
                  <th className="px-4 py-3">name</th>
                  <th className="px-4 py-3">Pollingstation</th>
                  <th className="px-4 py-3">tel</th>
                  <th className="px-4 py-3">date</th>
                  <th className="px-4 py-3">actions</th>
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
                    return (
                      <tr key={msg.id} className="border-b hover:bg-gray-50">
                        <td className="px-4 py-3">{serial}</td>
                        <td className="px-4 py-3">{msg.name}</td>
                        <td className="px-4 py-3">{msg.pollingStation}</td>
                        <td className="px-4 py-3 font-mono">{msg.tel}</td>
                        <td className="px-4 py-3">{msg.createdAt}</td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => setOpenMessageId(openMessageId === msg.id ? null : msg.id)}
                            className="text-green-600 hover:text-green-800 font-medium"
                          >
                            read
                          </button>

                          {openMessageId === msg.id && (
                            <div className="mt-2 p-3 bg-gray-50 border border-gray-200 rounded text-gray-800 text-sm">
                              <div className="font-medium mb-1">From: {msg.name} • {msg.tel}</div>
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

          {/* Bottom pagination – hidden when searching */}
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