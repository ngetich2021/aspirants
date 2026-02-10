"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { MoreVertical, ChevronLeft, ChevronRight } from "lucide-react";
import AspirantFormModal from "./AspirantFormModal";
import { deleteAspirantAction } from "./actions";

interface Aspirant {
  id: string;
  fullName: string;
  tel: string;
  position: string;
  pollingStationId: string;
  pollingStation?: { name: string };
  createdAt: Date;
}

interface Props {
  initialAspirants: Aspirant[];
  totalAspirants: number;
  currentPage: number;
  totalPages: number;
  limit: number;
}

export default function AspirantsClient({
  initialAspirants,
  totalAspirants,
  currentPage,
  totalPages,
  limit,
}: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [isOpen, setIsOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"add" | "edit" | "view">("add");
  const [selectedAspirant, setSelectedAspirant] = useState<Aspirant | undefined>();
  const [search, setSearch] = useState("");
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const [dropdownTop, setDropdownTop] = useState(0);
  const [dropdownLeft, setDropdownLeft] = useState(0);

  // Mirror server limit on client
  const [rowsPerPage, setRowsPerPage] = useState(limit);

  useEffect(() => {
    setRowsPerPage(limit);
  }, [limit]);

  useEffect(() => {
    if (!openDropdownId) return;
    const close = () => setOpenDropdownId(null);
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, [openDropdownId]);

  const toggleDropdown = (id: string, e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();

    if (openDropdownId === id) {
      setOpenDropdownId(null);
      return;
    }

    const rect = e.currentTarget.getBoundingClientRect();
    const gap = 8;
    const dropdownWidth = 160;
    const dropdownHeight = 100;

    let top = rect.bottom + gap;
    let left = rect.right - dropdownWidth;

    if (top + dropdownHeight > window.innerHeight) {
      top = rect.top - dropdownHeight - gap;
    }

    if (left < gap) left = gap;
    if (left + dropdownWidth > window.innerWidth - gap) {
      left = window.innerWidth - dropdownWidth - gap;
    }

    setDropdownTop(top);
    setDropdownLeft(left);
    setOpenDropdownId(id);
  };

  const openModal = (mode: "add" | "edit" | "view", aspirant?: Aspirant) => {
    setModalMode(mode);
    setSelectedAspirant(aspirant);
    setIsOpen(true);
    setOpenDropdownId(null);
  };

  const closeModal = () => {
    setIsOpen(false);
    setSelectedAspirant(undefined);
  };

  const handleSuccess = () => {
    closeModal();
    router.refresh();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this aspirant?")) return;

    try {
      await deleteAspirantAction(id);
      router.refresh();
    } catch (error) {
      console.error("Failed to delete aspirant:", error);
      alert("Failed to delete aspirant. Please try again.");
    }
  };

  const filteredAspirants = initialAspirants.filter((asp) =>
    [asp.fullName, asp.tel, asp.position, asp.pollingStationId]
      .join(" ")
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > totalPages) return;
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", newPage.toString());
    router.push(`?${params.toString()}`);
  };

  const handleLimitChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newLimit = Number(e.target.value);
    setRowsPerPage(newLimit);
    const params = new URLSearchParams(searchParams.toString());
    params.set("limit", newLimit.toString());
    params.set("page", "1"); // reset to first page when changing size
    router.push(`?${params.toString()}`);
  };

  const getPageNumbers = () => {
    const pages: number[] = [];
    const range = 2;

    for (let i = Math.max(1, currentPage - range); i <= Math.min(totalPages, currentPage + range); i++) {
      pages.push(i);
    }

    if (pages[0] > 1) {
      pages.unshift(1);
      if (pages[1] > 2) pages.splice(1, 0, -1); // ellipsis
    }

    if (pages[pages.length - 1] < totalPages) {
      if (pages[pages.length - 1] < totalPages - 1) pages.push(-1);
      pages.push(totalPages);
    }

    return pages;
  };

  const pageNumbers = getPageNumbers();

  return (
    <main className="min-h-screen bg-gray-100 p-4 sm:p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="bg-[#C0A7A7] p-4 rounded-md w-full sm:w-auto">
            <h1 className="text-xl sm:text-2xl font-bold">Total aspirants</h1>
            <p className="text-2xl sm:text-3xl text-purple-600 mt-2">
              {totalAspirants.toLocaleString()}
            </p>
          </div>
        </div>

        {/* Search + Rows per page selector */}
        <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4 mb-6">
          <input
            type="text"
            placeholder="Search aspirants..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full sm:max-w-md px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
          />

          <div className="flex items-center gap-3 whitespace-nowrap">
            <label className="text-sm font-medium text-gray-700">Show</label>
            <select
              value={rowsPerPage}
              onChange={handleLimitChange}
              className="px-3 py-2 border border-gray-300 rounded-md bg-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              {[20, 50, 100, 250, 500, 1000, 5000].map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
            <span className="text-sm text-gray-600">entries</span>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-lg shadow overflow-x-auto mb-6">
          <table className="w-full min-w-[1000px]">
            <thead className="bg-gray-50 text-xs uppercase tracking-wider">
              <tr>
                <th className="px-4 sm:px-6 py-3 text-left">S/NO</th>
                <th className="px-4 sm:px-6 py-3 text-left">name</th>
                <th className="px-4 sm:px-6 py-3 text-left">Pollingstation</th>
                <th className="px-4 sm:px-6 py-3 text-left">tel</th>
                <th className="px-4 sm:px-6 py-3 text-left">position</th>
                <th className="px-4 sm:px-6 py-3 text-left">date</th>
                <th className="px-4 sm:px-6 py-3 text-center">actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredAspirants.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-gray-500">
                    No aspirants found
                  </td>
                </tr>
              ) : (
                filteredAspirants.map((asp, index) => (
                  <tr
                    key={asp.id}
                    className="hover:bg-gray-50 cursor-pointer"
                    onClick={() => openModal("view", asp)}
                  >
                    <td className="px-4 sm:px-6 py-4 text-sm">
                      {(currentPage - 1) * limit + index + 1}
                    </td>
                    <td className="px-4 sm:px-6 py-4 font-medium text-sm">
                      {asp.fullName}
                    </td>
                    <td className="px-4 sm:px-6 py-4 text-sm">
                      {asp.pollingStation?.name || asp.pollingStationId}
                    </td>
                    <td className="px-4 sm:px-6 py-4 text-sm">{asp.tel}</td>
                    <td className="px-4 sm:px-6 py-4 text-sm">{asp.position}</td>
                    <td className="px-4 sm:px-6 py-4 text-sm">
                      {new Date(asp.createdAt).toLocaleDateString("en-GB", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "2-digit",
                      }).replace(/\//g, "-")}
                    </td>
                    <td
                      className="px-4 sm:px-6 py-4 text-center"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        onClick={(e) => toggleDropdown(asp.id, e)}
                        className="p-2 hover:bg-gray-200 rounded-full transition"
                      >
                        <MoreVertical className="w-5 h-5 text-gray-600" />
                      </button>

                      {openDropdownId === asp.id && (
                        <div
                          className="fixed z-[10000] w-40 bg-white border border-gray-200 rounded-md shadow-lg py-1"
                          style={{ top: `${dropdownTop}px`, left: `${dropdownLeft}px` }}
                        >
                          <button
                            onClick={() => {
                              setOpenDropdownId(null);
                              openModal("edit", asp);
                            }}
                            className="block w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(asp.id)}
                            className="block w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50"
                          >
                            Delete
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination footer */}
        {totalPages > 1 && (
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 text-sm">
            <div className="text-gray-600">
              Showing{" "}
              <span className="font-medium">
                {(currentPage - 1) * limit + 1}–
                {Math.min(currentPage * limit, totalAspirants)}
              </span>{" "}
              of <span className="font-medium">{totalAspirants.toLocaleString()}</span> entries
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="p-2 rounded border border-gray-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>

              {pageNumbers.map((pageNum, idx) =>
                pageNum === -1 ? (
                  <span key={`ellipsis-${idx}`} className="px-3 py-2 text-gray-500">
                    ...
                  </span>
                ) : (
                  <button
                    key={pageNum}
                    onClick={() => handlePageChange(pageNum)}
                    className={`min-w-[2.25rem] py-2 rounded border ${
                      pageNum === currentPage
                        ? "bg-purple-600 text-white border-purple-600 font-medium"
                        : "border-gray-300 hover:bg-gray-50"
                    }`}
                  >
                    {pageNum}
                  </button>
                )
              )}

              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="p-2 rounded border border-gray-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        {/* Modal / Right-side Drawer */}
        {isOpen && (
          <div className="fixed inset-0 z-50 flex justify-end">
            <div
              className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity duration-300"
              onClick={closeModal}
            />

            <div className="relative w-full max-w-lg bg-white h-full shadow-2xl overflow-hidden flex flex-col">
              <div className="sticky top-0 z-10 bg-white border-b px-6 py-5 flex justify-between items-center">
                <h2 className="text-xl font-bold text-gray-900">
                  {modalMode === "add"
                    ? "Add Aspirant"
                    : modalMode === "edit"
                    ? "Edit Aspirant"
                    : "View Aspirant"}
                </h2>
                <button
                  onClick={closeModal}
                  className="text-3xl text-gray-500 hover:text-gray-700 leading-none"
                  aria-label="Close"
                >
                  ×
                </button>
              </div>

              <div className="p-6 overflow-y-auto flex-1">
                <AspirantFormModal
                  mode={modalMode}
                  aspirant={selectedAspirant}
                  onSuccess={handleSuccess}
                  onClose={closeModal}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}