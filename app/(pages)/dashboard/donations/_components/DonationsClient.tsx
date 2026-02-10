// app/donations/_components/DonationsClient.tsx
"use client";

import { useState } from "react";

type Totals = {
  totalFunds: number;
  totalGifts: number;
  totalAgents: number;
};

type Fund = {
  id: string;
  name: string | null;
  tel: string | null;
  amount: number;
};

type Gift = {
  id: string;
  name: string | null;
  tel: string | null;
  describe: string;
};

type Agent = {
  id: string;
  fullName: string;
  tel: string;
  tel2: string | null;
  position: string | null;
  pollingStation: { name: string } | null;
};

type Props = {
  totals: Totals;
  initialFunds: Fund[];
  initialGifts: Gift[];
  initialAgents: Agent[];
};

const PAGE_SIZES = [20, 50, 100, 250, 500, 1000] as const;
type PageSize = (typeof PAGE_SIZES)[number];

export default function DonationsClient({
  totals,
  initialFunds,
  initialGifts,
  initialAgents,
}: Props) {
  const [view, setView] = useState<"funds" | "gifts" | "agents">("funds");

  const [fundsPage, setFundsPage] = useState(1);
  const [fundsPageSize, setFundsPageSize] = useState<PageSize>(100);

  const [giftsPage, setGiftsPage] = useState(1);
  const [giftsPageSize, setGiftsPageSize] = useState<PageSize>(100);

  const [agentsPage, setAgentsPage] = useState(1);
  const [agentsPageSize, setAgentsPageSize] = useState<PageSize>(100);

  const getPaginated = <T,>(items: readonly T[], page: number, size: PageSize): T[] => {
    const start = (page - 1) * size;
    return items.slice(start, start + size);
  };

  const getTotalPages = (count: number, size: PageSize): number =>
    Math.max(1, Math.ceil(count / size));

  const fundsTotalPages = getTotalPages(initialFunds.length, fundsPageSize);
  const currentFunds = getPaginated(initialFunds, fundsPage, fundsPageSize);

  const giftsTotalPages = getTotalPages(initialGifts.length, giftsPageSize);
  const currentGifts = getPaginated(initialGifts, giftsPage, giftsPageSize);

  const agentsTotalPages = getTotalPages(initialAgents.length, agentsPageSize);
  const currentAgents = getPaginated(initialAgents, agentsPage, agentsPageSize);

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-6 md:px-8">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-gray-800 md:text-3xl">
            Donations Overview
          </h1>

          <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-3">
            <div className="rounded-xl bg-white p-6 shadow-sm border border-gray-200 text-center">
              <h3 className="text-lg font-semibold text-green-700">Total Funds</h3>
              <p className="mt-2 text-3xl font-bold text-gray-900">
                {totals.totalFunds.toLocaleString()}
                <span className="ml-1 text-xl font-normal text-gray-500">KES</span>
              </p>
            </div>

            <div className="rounded-xl bg-white p-6 shadow-sm border border-gray-200 text-center">
              <h3 className="text-lg font-semibold text-pink-600">Total Gifts</h3>
              <p className="mt-2 text-3xl font-bold text-gray-900">
                {totals.totalGifts.toLocaleString()}
              </p>
            </div>

            <div className="rounded-xl bg-white p-6 shadow-sm border border-gray-200 text-center">
              <h3 className="text-lg font-semibold text-blue-600">Skill-Agents</h3>
              <p className="mt-2 text-3xl font-bold text-gray-900">
                {totals.totalAgents.toLocaleString()}
              </p>
            </div>
          </div>

          <div className="mt-8 flex justify-center">
            <div className="inline-flex items-center gap-3 rounded-lg bg-white px-5 py-3 shadow-sm border border-gray-200">
              <label className="font-medium text-gray-700">View:</label>
              <select
                value={view}
                onChange={(e) => setView(e.target.value as typeof view)}
                className="rounded-md border border-gray-300 bg-white px-4 py-2 text-gray-800 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none"
              >
                <option value="funds">Funds</option>
                <option value="gifts">Gifts</option>
                <option value="agents">Skills</option>
              </select>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="rounded-xl bg-white shadow-sm border border-gray-200">
          {view === "funds" && (
            <div className="p-6">
              <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <h2 className="text-xl font-semibold text-gray-800">Funds Donations</h2>
                <PageSizeSelector
                  pageSize={fundsPageSize}
                  onChange={(size) => {
                    setFundsPageSize(size);
                    setFundsPage(1);
                  }}
                />
              </div>

              <DataTable data={currentFunds} type="funds" />

              {initialFunds.length > 0 && (
                <PaginationBottom
                  currentPage={fundsPage}
                  totalPages={fundsTotalPages}
                  onPageChange={setFundsPage}
                />
              )}
            </div>
          )}

          {view === "gifts" && (
            <div className="p-6">
              <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <h2 className="text-xl font-semibold text-gray-800">Gifts Received</h2>
                <PageSizeSelector
                  pageSize={giftsPageSize}
                  onChange={(size) => {
                    setGiftsPageSize(size);
                    setGiftsPage(1);
                  }}
                />
              </div>

              <DataTable data={currentGifts} type="gifts" />

              {initialGifts.length > 0 && (
                <PaginationBottom
                  currentPage={giftsPage}
                  totalPages={giftsTotalPages}
                  onPageChange={setGiftsPage}
                />
              )}
            </div>
          )}

          {view === "agents" && (
            <div className="p-6">
              <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <h2 className="text-xl font-semibold text-gray-800">Skill-Agents</h2>
                <PageSizeSelector
                  pageSize={agentsPageSize}
                  onChange={(size) => {
                    setAgentsPageSize(size);
                    setAgentsPage(1);
                  }}
                />
              </div>

              <DataTable data={currentAgents} type="agents" />

              {initialAgents.length > 0 && (
                <PaginationBottom
                  currentPage={agentsPage}
                  totalPages={agentsTotalPages}
                  onPageChange={setAgentsPage}
                />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────
// Page Size Selector (Top)
// ────────────────────────────────────────────────

function PageSizeSelector({
  pageSize,
  onChange,
}: {
  pageSize: PageSize;
  onChange: (size: PageSize) => void;
}) {
  return (
    <div className="flex items-center gap-3">
      <label className="text-sm font-medium text-gray-700 whitespace-nowrap">
        Rows:
      </label>
      <select
        value={pageSize}
        onChange={(e) => onChange(Number(e.target.value) as PageSize)}
        className="rounded border border-gray-300 bg-white px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
      >
        {PAGE_SIZES.map((size) => (
          <option key={size} value={size}>
            {size}
          </option>
        ))}
      </select>
    </div>
  );
}

// ────────────────────────────────────────────────
// Bottom Pagination (Previous / Page X of Y / Next)
// ────────────────────────────────────────────────

function PaginationBottom({
  currentPage,
  totalPages,
  onPageChange,
}: {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}) {
  return (
    <div className="mt-6 flex items-center justify-center gap-4 sm:justify-between">
      <button
        onClick={() => onPageChange(Math.max(1, currentPage - 1))}
        disabled={currentPage <= 1}
        className="rounded border border-gray-300 px-5 py-2 text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        Previous
      </button>

      <span className="text-sm font-medium">
        Page {currentPage} of {totalPages}
      </span>

      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage >= totalPages}
        className="rounded border border-gray-300 px-5 py-2 text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        Next
      </button>
    </div>
  );
}

// ────────────────────────────────────────────────
// Reusable Table (unchanged)
// ────────────────────────────────────────────────

type TableType = "funds" | "gifts" | "agents";

function DataTable({
  data,
  type,
}: {
  data: readonly (Fund | Gift | Agent)[];
  type: TableType;
}) {
  if (data.length === 0) {
    return (
      <div className="py-12 text-center text-gray-500">
        No records found in this category.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600">
              #
            </th>

            {type === "funds" && (
              <>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600">
                  Name
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600">
                  Telephone
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600">
                  Amount (KES)
                </th>
              </>
            )}

            {type === "gifts" && (
              <>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600">
                  Name
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600">
                  Telephone
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600">
                  Description
                </th>
              </>
            )}

            {type === "agents" && (
              <>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600">
                  Full Name
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600">
                  Position
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600">
                  Tel 1
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600">
                  Tel 2
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600">
                  Station
                </th>
              </>
            )}
          </tr>
        </thead>

        <tbody className="divide-y divide-gray-100 bg-white">
          {data.map((item, index) => (
            <tr key={item.id} className="hover:bg-gray-50 transition-colors">
              <td className="whitespace-nowrap px-4 py-4 text-sm text-gray-500">
                {index + 1}
              </td>

              {type === "funds" && (
                <>
                  <td className="whitespace-nowrap px-4 py-4 text-sm text-gray-900">
                    {(item as Fund).name ?? "—"}
                  </td>
                  <td className="whitespace-nowrap px-4 py-4 text-sm text-gray-600">
                    {(item as Fund).tel ?? "—"}
                  </td>
                  <td className="whitespace-nowrap px-4 py-4 text-sm font-medium text-green-700">
                    {(item as Fund).amount.toLocaleString()}
                  </td>
                </>
              )}

              {type === "gifts" && (
                <>
                  <td className="whitespace-nowrap px-4 py-4 text-sm text-gray-900">
                    {(item as Gift).name ?? "—"}
                  </td>
                  <td className="whitespace-nowrap px-4 py-4 text-sm text-gray-600">
                    {(item as Gift).tel ?? "—"}
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-700">
                    {(item as Gift).describe}
                  </td>
                </>
              )}

              {type === "agents" && (
                <>
                  <td className="whitespace-nowrap px-4 py-4 text-sm font-medium text-gray-900">
                    {(item as Agent).fullName}
                  </td>
                  <td className="whitespace-nowrap px-4 py-4 text-sm text-gray-700">
                    {(item as Agent).position ?? "—"}
                  </td>
                  <td className="whitespace-nowrap px-4 py-4 text-sm text-gray-600">
                    {(item as Agent).tel}
                  </td>
                  <td className="whitespace-nowrap px-4 py-4 text-sm text-gray-600">
                    {(item as Agent).tel2 ?? "—"}
                  </td>
                  <td className="whitespace-nowrap px-4 py-4 text-sm text-gray-600">
                    {(item as Agent).pollingStation?.name ?? "—"}
                  </td>
                </>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}