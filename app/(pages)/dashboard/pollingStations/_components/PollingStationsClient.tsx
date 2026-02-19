"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { MoreVertical, Upload } from "lucide-react";
import PollingStationFormModal from "./PollingStationFormModal";
import { deletePollingStationAction, uploadPollingStationsAction } from "./actions";

interface PollingStation {
  id: string;
  name: string;
  ward: string;
  county: string;
  subCounty: string;
  votes: number;
  aspirantsCount: number;
}

interface Props {
  totalStations: number;
  initialStations: PollingStation[];
}

interface DeleteSuccess {
  success: true;
}

interface DeleteError {
  success: false;
  error: string;
}

type DeleteResult = DeleteSuccess | DeleteError;

interface UploadSuccess {
  success: true;
  message: string;
  created: number;
  updated: number;
  errors?: string[];
}

interface UploadFailure {
  success: false;
  message: string;
  created: number;
  updated: number;
  errors?: string[];
}

type UploadResult = UploadSuccess | UploadFailure;

const PAGE_SIZES = [20, 50, 100, 200, 500, 1000, 5000] as const;
type PageSize = (typeof PAGE_SIZES)[number];

type FilterOption = "all" | "red" | "orange" | "green";

export default function PollingStationsClient({
  totalStations,
  initialStations,
}: Props) {
  const router = useRouter();

  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [modalMode, setModalMode] = useState<"add" | "edit" | "view">("add");
  const [selectedStation, setSelectedStation] = useState<PollingStation | undefined>(undefined);

  const [uploadOpen, setUploadOpen] = useState<boolean>(false);
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);
  const [uploading, setUploading] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const [search, setSearch] = useState<string>("");
  const [filter, setFilter] = useState<FilterOption>("all");
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const [dropdownTop, setDropdownTop] = useState<number>(0);
  const [dropdownLeft, setDropdownLeft] = useState<number>(0);

  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<PageSize>(100);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, filter]);

  useEffect(() => {
    if (!openDropdownId) return;
    const close = () => setOpenDropdownId(null);
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, [openDropdownId]);

  // Summary counts for status cards
  const zeroCount  = initialStations.filter(s => s.aspirantsCount === 0).length;
  const lowCount   = initialStations.filter(s => s.aspirantsCount >= 1 && s.aspirantsCount <= 19).length;
  const goodCount  = initialStations.filter(s => s.aspirantsCount >= 20).length;

  // Filtered & searched stations
  let visibleStations = initialStations;

  if (filter !== "all") {
    if (filter === "red")    visibleStations = visibleStations.filter(s => s.aspirantsCount === 0);
    if (filter === "orange") visibleStations = visibleStations.filter(s => s.aspirantsCount >= 1 && s.aspirantsCount <= 19);
    if (filter === "green")  visibleStations = visibleStations.filter(s => s.aspirantsCount >= 20);
  }

  if (search.trim()) {
    const term = search.toLowerCase();
    visibleStations = visibleStations.filter(st =>
      `${st.name} ${st.ward}`.toLowerCase().includes(term)
    );
  }

  const totalFiltered = visibleStations.length;
  const totalPages = Math.ceil(totalFiltered / pageSize);
  const safePage = Math.max(1, Math.min(currentPage, totalPages || 1));

  const startIndex = (safePage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const currentPageStations = visibleStations.slice(startIndex, endIndex);

  const toggleDropdown = (id: string, e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    if (openDropdownId === id) {
      setOpenDropdownId(null);
      return;
    }

    const rect = e.currentTarget.getBoundingClientRect();
    const gap = 8;
    const width = 160;

    let top = rect.bottom + gap;
    let left = rect.right - width;

    if (top + 120 > window.innerHeight) top = rect.top - 120 - gap;
    if (left < gap) left = gap;
    if (left + width > window.innerWidth - gap) left = window.innerWidth - width - gap;

    setDropdownTop(top);
    setDropdownLeft(left);
    setOpenDropdownId(id);
  };

  const openModal = (mode: "add" | "edit" | "view", station?: PollingStation) => {
    setModalMode(mode);
    setSelectedStation(station);
    setIsOpen(true);
    setOpenDropdownId(null);
  };

  const closeModal = () => {
    setIsOpen(false);
    setSelectedStation(undefined);
  };

  const handleSuccess = () => {
    closeModal();
    router.refresh();
  };

  const handleDelete = async (id: string): Promise<void> => {
    if (!confirm("Delete this polling station?")) return;
    try {
      const res = await deletePollingStationAction(id);
      if ("success" in res && res.success) {
        router.refresh();
      } else if ("error" in res) {
        alert(res.error || "Delete failed");
      }
    } catch {
      alert("Error deleting station");
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>): Promise<void> => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setUploadResult(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const result = await uploadPollingStationsAction(formData);
      setUploadResult(result);
      if (result.success) {
        router.refresh();
        setTimeout(() => setUploadOpen(false), 2200);
      }
    } catch {
      setUploadResult({
        success: false,
        message: "Upload failed unexpectedly",
        created: 0,
        updated: 0,
      });
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const getStatusColor = (count: number): string => {
    if (count === 0) return "text-red-700 font-semibold";
    if (count <= 19) return "text-orange-600 font-medium";
    return "text-green-700 font-semibold";
  };

  return (
    <main className="min-h-screen bg-gray-100 p-4 sm:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 flex-wrap">
          <div className="bg-[#C0A7A7] p-5 rounded-lg w-full sm:w-auto min-w-[240px]">
            <h1 className="text-2xl font-bold">Polling Stations</h1>
            <p className="text-3xl text-purple-700 mt-3 font-semibold">
              {totalStations} {totalStations === 1 ? "station" : "stations"}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <button
              onClick={() => openModal("add")}
              className="bg-purple-600 hover:bg-purple-700 text-white px-7 py-3 rounded-lg font-medium shadow-sm"
            >
              + Add Single Station
            </button>
            <button
              onClick={() => setUploadOpen(true)}
              className="bg-green-600 hover:bg-green-700 text-white px-7 py-3 rounded-lg font-medium flex items-center gap-2 shadow-sm"
            >
              <Upload size={18} /> Upload Excel/CSV
            </button>
          </div>
        </div>

        {/* Status cards – always horizontal, smaller size */}
        <div className="mb-8 flex flex-row flex-wrap justify-center gap-4 sm:gap-6">
          <div className="bg-white p-4 rounded-xl shadow border border-red-100 flex flex-col items-center min-w-[110px]">
            <div className="w-14 h-14 rounded-full bg-red-500 flex items-center justify-center text-white text-2xl font-bold mb-2">
              {zeroCount}
            </div>
            <p className="text-gray-700 font-medium text-sm">0 Voters</p>
          </div>

          <div className="bg-white p-4 rounded-xl shadow border border-orange-100 flex flex-col items-center min-w-[110px]">
            <div className="w-14 h-14 rounded-full bg-orange-500 flex items-center justify-center text-white text-2xl font-bold mb-2">
              {lowCount}
            </div>
            <p className="text-gray-700 font-medium text-sm">1–19 Voters</p>
          </div>

          <div className="bg-white p-4 rounded-xl shadow border border-green-100 flex flex-col items-center min-w-[110px]">
            <div className="w-14 h-14 rounded-full bg-green-500 flex items-center justify-center text-white text-2xl font-bold mb-2">
              {goodCount}
            </div>
            <p className="text-gray-700 font-medium text-sm">20+ Voters</p>
          </div>
        </div>

        {/* Search + rows + filter */}
        <div className="mb-6 flex flex-col sm:flex-row gap-4 items-start sm:items-center flex-wrap">
          <input
            type="text"
            placeholder="Search by name or ward..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 min-w-[220px] px-5 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400"
          />

          <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 items-start sm:items-center">
            <div className="flex items-center gap-3 whitespace-nowrap">
              <label className="text-sm font-medium text-gray-700">Rows per page:</label>
              <select
                value={pageSize}
                onChange={(e) => {
                  const value = Number(e.target.value);
                  if (PAGE_SIZES.includes(value as PageSize)) {
                    setPageSize(value as PageSize);
                    setCurrentPage(1);
                  }
                }}
                className="border border-gray-300 rounded px-4 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-purple-400"
              >
                {PAGE_SIZES.map((size) => (
                  <option key={size} value={size}>
                    {size}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-3 whitespace-nowrap">
              <label className="text-sm font-medium text-gray-700">Show:</label>
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value as FilterOption)}
                className="border border-gray-300 rounded px-4 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-purple-400"
              >
                <option value="all">All</option>
                <option value="red">Red (0)</option>
                <option value="orange">Orange (1–19)</option>
                <option value="green">Green (20+)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl shadow overflow-x-auto">
          <table className="w-full min-w-[1000px]">
            <thead className="bg-gray-50 text-xs uppercase tracking-wider text-gray-600">
              <tr>
                <th className="px-6 py-4 text-left">S/NO</th>
                <th className="px-6 py-4 text-left">Name</th>
                <th className="px-6 py-4 text-left">Ward</th>
                <th className="px-6 py-4 text-left">Votes</th>
                <th className="px-6 py-4 text-center">Target (50%)</th>
                <th className="px-6 py-4 text-center">Voters</th>
                <th className="px-6 py-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {currentPageStations.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-gray-500 italic">
                    {search || filter !== "all"
                      ? "No matching stations found"
                      : "No polling stations yet"}
                  </td>
                </tr>
              ) : (
                currentPageStations.map((station, idx) => {
                  const target = Math.round(station.votes * 0.5);
                  const statusColor = getStatusColor(station.aspirantsCount);

                  return (
                    <tr
                      key={station.id}
                      className="hover:bg-gray-50/70 cursor-pointer transition-colors"
                      onClick={() => openModal("view", station)}
                    >
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {startIndex + idx + 1}
                      </td>
                      <td className={`px-6 py-4 font-medium ${statusColor}`}>
                        {station.name}
                      </td>
                      <td className="px-6 py-4 text-gray-700">{station.ward}</td>
                      <td className="px-6 py-4 text-gray-900">
                        {station.votes.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-center text-gray-800 font-medium">
                        {target.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={statusColor}>
                          {station.aspirantsCount}
                        </span>
                      </td>
                      <td
                        className="px-6 py-4 text-center"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          onClick={(e) => toggleDropdown(station.id, e)}
                          className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                        >
                          <MoreVertical className="w-5 h-5 text-gray-600" />
                        </button>

                        {openDropdownId === station.id && (
                          <div
                            className="fixed z-[10000] w-44 bg-white border rounded-lg shadow-xl py-1"
                            style={{
                              top: `${dropdownTop}px`,
                              left: `${dropdownLeft}px`,
                            }}
                          >
                            <button
                              onClick={() => {
                                setOpenDropdownId(null);
                                openModal("edit", station);
                              }}
                              className="block w-full text-left px-5 py-2.5 text-sm hover:bg-gray-50"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDelete(station.id)}
                              className="block w-full text-left px-5 py-2.5 text-sm text-red-600 hover:bg-red-50"
                            >
                              Delete
                            </button>
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

        {/* Pagination */}
        {totalFiltered > 0 && (
          <div className="mt-6 flex flex-col sm:flex-row justify-between items-center gap-4 text-sm text-gray-700">
            <div>
              Showing {startIndex + 1}–{Math.min(endIndex, totalFiltered)} of{" "}
              {totalFiltered.toLocaleString()}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={safePage === 1}
                className="px-5 py-2 border rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
              >
                Previous
              </button>

              <span className="px-4 py-2 font-medium">
                Page {safePage} of {totalPages}
              </span>

              <button
                onClick={() => setCurrentPage((p) => p + 1)}
                disabled={safePage >= totalPages}
                className="px-5 py-2 border rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        )}

        {/* Single station modal */}
        {isOpen && (
          <div className="fixed inset-0 z-50 flex justify-end">
            <div className="absolute inset-0 bg-black/40" onClick={closeModal} />
            <div className="relative w-full max-w-lg bg-white h-full shadow-2xl flex flex-col">
              <div className="sticky top-0 z-10 bg-white border-b p-5 flex justify-between items-center">
                <h2 className="text-xl font-bold">
                  {modalMode === "add"
                    ? "Add Polling Station"
                    : modalMode === "edit"
                    ? "Edit Polling Station"
                    : "View Polling Station"}
                </h2>
                <button
                  onClick={closeModal}
                  className="text-3xl text-gray-500 hover:text-gray-700"
                >
                  ×
                </button>
              </div>
              <div className="p-6 overflow-y-auto flex-1">
                <PollingStationFormModal
                  mode={modalMode}
                  station={selectedStation}
                  onSuccess={handleSuccess}
                  onClose={closeModal}
                />
              </div>
            </div>
          </div>
        )}

        {/* Bulk upload modal */}
        {uploadOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full">
              <div className="p-6">
                <h2 className="text-2xl font-bold mb-6 text-center">
                  Upload Polling Stations (CSV, XLSX, XLS)
                </h2>

                {uploadResult && !uploadResult.success && uploadResult.message && (
                  <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg mb-5">
                    {uploadResult.message}
                  </div>
                )}

                {uploadResult && uploadResult.success && (
                  <div className="bg-green-50 border border-green-200 text-green-700 p-4 rounded-lg mb-5">
                    <p className="font-medium">{uploadResult.message}</p>
                    {uploadResult.errors && uploadResult.errors.length > 0 && (
                      <div className="mt-3 text-sm">
                        <p className="font-medium text-red-600">Some rows had issues:</p>
                        <ul className="list-disc pl-5 mt-1 max-h-40 overflow-y-auto">
                          {uploadResult.errors.map((err, i) => (
                            <li key={i}>{err}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}

                <div className="border-2 border-dashed border-gray-300 rounded-lg p-10 text-center">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv,.xlsx,.xls"
                    onChange={handleFileChange}
                    disabled={uploading}
                    className="hidden"
                    id="bulk-upload"
                  />
                  <label
                    htmlFor="bulk-upload"
                    className={`cursor-pointer block ${uploading ? "opacity-50 pointer-events-none" : ""}`}
                  >
                    <Upload className="mx-auto h-12 w-12 text-gray-400" />
                    <p className="mt-4 text-lg font-medium text-gray-700">
                      {uploading ? "Processing..." : "Click to select file"}
                    </p>
                    <p className="mt-2 text-sm text-gray-500">
                      Supported: .csv, .xlsx, .xls<br />
                      Required columns (case insensitive): stationId, name, county, subCounty, ward<br />
                      votes is optional (number)
                    </p>
                  </label>
                </div>

                <div className="mt-8">
                  <button
                    onClick={() => setUploadOpen(false)}
                    disabled={uploading}
                    className="w-full bg-gray-200 hover:bg-gray-300 py-3 rounded-lg font-medium disabled:opacity-50"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}