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
}

interface Props {
  totalStations: number;
  initialStations: PollingStation[];
}

// Type returned by deletePollingStationAction
type DeleteResult = { success: true } | { error: string };

// Type returned by uploadPollingStationsAction
interface UploadResult {
  success: boolean;
  message: string;
  created: number;
  updated: number;
  errors?: string[];
}

const PAGE_SIZES = [20, 50, 100, 200, 500, 1000, 5000] as const;
type PageSize = (typeof PAGE_SIZES)[number];

export default function PollingStationsClient({
  totalStations,
  initialStations,
}: Props) {
  const router = useRouter();

  const [isOpen, setIsOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"add" | "edit" | "view">("add");
  const [selectedStation, setSelectedStation] = useState<PollingStation | undefined>();

  const [uploadOpen, setUploadOpen] = useState(false);
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);
  const [uploading, setUploading] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const [search, setSearch] = useState("");
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const [dropdownTop, setDropdownTop] = useState(0);
  const [dropdownLeft, setDropdownLeft] = useState(0);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState<PageSize>(100);

  // Reset page when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [search]);

  // Close dropdown when clicking outside
  useEffect(() => {
    if (!openDropdownId) return;
    const close = () => setOpenDropdownId(null);
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, [openDropdownId]);

  // Type guards
  const isDeleteSuccess = (result: DeleteResult): result is { success: true } =>
    "success" in result && result.success === true;

  const isUploadSuccess = (result: UploadResult): result is UploadResult & { success: true } =>
    result.success === true;

  const toggleDropdown = (id: string, e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    if (openDropdownId === id) {
      setOpenDropdownId(null);
      return;
    }

    const rect = e.currentTarget.getBoundingClientRect();
    const gap = 8;
    const dropdownWidth = 160;

    let top = rect.bottom + gap;
    let left = rect.right - dropdownWidth;

    if (top + 100 > window.innerHeight) top = rect.top - 100 - gap;
    if (left < gap) left = gap;
    if (left + dropdownWidth > window.innerWidth - gap) {
      left = window.innerWidth - dropdownWidth - gap;
    }

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

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this polling station?")) return;

    try {
      const res = await deletePollingStationAction(id);
      if (isDeleteSuccess(res)) {
        router.refresh();
      } else {
        alert(res.error || "Delete failed");
      }
    } catch (err) {
      console.error("Delete error:", err);
      alert("Error deleting station");
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setUploadResult(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const result = await uploadPollingStationsAction(formData);
      setUploadResult(result);

      if (isUploadSuccess(result)) {
        router.refresh();
        setTimeout(() => setUploadOpen(false), 2200);
      }
    } catch (err) {
      console.error("Upload error:", err);
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

  // Filtering & Pagination logic
  const filteredStations = initialStations.filter((st) =>
    `${st.name} ${st.ward}`.toLowerCase().includes(search.toLowerCase())
  );

  const totalFiltered = filteredStations.length;
  const totalPages = Math.ceil(totalFiltered / pageSize);

  const safePage = Math.max(1, Math.min(currentPage, totalPages || 1));

  const startIndex = (safePage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const currentPageStations = filteredStations.slice(startIndex, endIndex);

  return (
    <main className="min-h-screen bg-gray-100 p-4 sm:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 flex-wrap">
          <div className="bg-[#C0A7A7] p-4 rounded-md w-full sm:w-auto">
            <h1 className="text-xl sm:text-2xl font-bold">Polling Stations</h1>
            <p className="text-2xl sm:text-3xl text-purple-600 mt-2">
              {totalStations} station{totalStations !== 1 ? "s" : ""}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            <button
              onClick={() => openModal("add")}
              className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg font-medium"
            >
              + Add Single Station
            </button>
            <button
              onClick={() => setUploadOpen(true)}
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-medium flex items-center justify-center gap-2"
            >
              <Upload size={18} /> Upload Excel/CSV
            </button>
          </div>
        </div>

        {/* Search + Rows per page */}
        <div className="mb-6 flex flex-col sm:flex-row gap-4 items-stretch sm:items-center">
          <input
            type="text"
            placeholder="Search by name or ward..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
          />

          <div className="flex items-center gap-3 whitespace-nowrap">
            <label htmlFor="pageSize" className="text-sm font-medium text-gray-700">
              Rows per page:
            </label>
            <select
              id="pageSize"
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value) as PageSize);
                setCurrentPage(1);
              }}
              className="border border-gray-300 rounded-md px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              {PAGE_SIZES.map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-lg shadow overflow-x-auto">
          <table className="w-full min-w-[800px]">
            <thead className="bg-gray-50 text-xs uppercase">
              <tr>
                <th className="px-4 sm:px-6 py-3 text-left">S/NO</th>
                <th className="px-4 sm:px-6 py-3 text-left">Name</th>
                <th className="px-4 sm:px-6 py-3 text-left">Ward</th>
                <th className="px-4 sm:px-6 py-3 text-left">Votes</th>
                <th className="px-4 sm:px-6 py-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {currentPageStations.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-gray-500">
                    {search
                      ? "No matching polling stations found"
                      : "No polling stations found"}
                  </td>
                </tr>
              ) : (
                currentPageStations.map((station, index) => (
                  <tr
                    key={station.id}
                    className="hover:bg-gray-50 cursor-pointer"
                    onClick={() => openModal("view", station)}
                  >
                    <td className="px-4 sm:px-6 py-4 text-sm">
                      {(safePage - 1) * pageSize + index + 1}
                    </td>
                    <td className="px-4 sm:px-6 py-4 font-medium text-sm">
                      {station.name}
                    </td>
                    <td className="px-4 sm:px-6 py-4 text-sm">{station.ward}</td>
                    <td className="px-4 sm:px-6 py-4 text-sm font-medium">
                      {station.votes.toLocaleString()}
                    </td>
                    <td
                      className="px-4 sm:px-6 py-4 text-center"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        onClick={(e) => toggleDropdown(station.id, e)}
                        className="p-2 hover:bg-gray-200 rounded-full"
                      >
                        <MoreVertical className="w-5 h-5" />
                      </button>

                      {openDropdownId === station.id && (
                        <div
                          className="fixed z-[10000] w-40 bg-white border rounded-md shadow-lg"
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
                            className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(station.id)}
                            className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
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

        {/* Pagination controls */}
        {totalFiltered > 0 && (
          <div className="mt-6 flex flex-col sm:flex-row justify-between items-center gap-4 text-sm">
            <div className="text-gray-700">
              Showing {startIndex + 1}–{Math.min(endIndex, totalFiltered)} of{" "}
              {totalFiltered.toLocaleString()}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={safePage === 1}
                className="px-4 py-2 border rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
              >
                Previous
              </button>

              <span className="px-3 py-2 font-medium">
                Page {safePage} of {totalPages}
              </span>

              <button
                onClick={() => setCurrentPage((p) => p + 1)}
                disabled={safePage >= totalPages}
                className="px-4 py-2 border rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
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
            <div className="relative w-full sm:max-w-lg bg-white h-full shadow-2xl flex flex-col">
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

                {uploadResult && isUploadSuccess(uploadResult) && (
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
                      Required columns (case insensitive, no spaces):<br />
                      stationId, name, county, subCounty, ward<br />
                      votes is optional (number)
                    </p>
                  </label>
                </div>

                <div className="mt-8 flex gap-4">
                  <button
                    onClick={() => setUploadOpen(false)}
                    disabled={uploading}
                    className="flex-1 bg-gray-200 hover:bg-gray-300 py-3 rounded-lg font-medium disabled:opacity-50"
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