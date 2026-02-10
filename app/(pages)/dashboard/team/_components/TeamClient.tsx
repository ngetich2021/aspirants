'use client';

import React, { useState, useMemo, useEffect } from "react";
import { deleteOfficialAction } from "./actionsTeam";
import AddOfficialForm from "./AddOfficialForm";
import ViewDesignations from "./ViewDesignations";

type User = { id: string; email: string };
type Station = { id: string; name: string };
type Designation = { id: string; name: string };

type Official = {
  userId: string;
  fullName: string | null;
  email: string | null;
  designation: string | null;
  designationId: string | null;
  tel: string | null;
  tel2: string | null;
  stationId: string | null;
  stationName: string | null;
  image: string | null;
};

interface TeamClientProps {
  initialUsers: User[];
  initialStations: Station[];
  initialDesignations: Designation[];
  initialOfficials: Official[];
  initialCount: number;
}

const ITEMS_PER_PAGE = 12;

export default function TeamClient({
  initialUsers,
  initialStations,
  initialDesignations,
  initialOfficials,
  initialCount,
}: TeamClientProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Official | null>(null);
  const [viewDesignationsOpen, setViewDesignationsOpen] = useState(false);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  useEffect(() => {
    if (!openMenuId) return;
    const handle = () => setOpenMenuId(null);
    document.addEventListener("click", handle);
    return () => document.removeEventListener("click", handle);
  }, [openMenuId]);

  const toggleMenu = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setOpenMenuId(openMenuId === id ? null : id);
  };

  const handleEdit = (off: Official) => {
    setEditing(off);
    setFormOpen(true);
    setOpenMenuId(null);
  };

  const handleDelete = async (off: Official) => {
    if (!confirm(`Delete ${off.fullName || "official"}?`)) return;
    const res = await deleteOfficialAction(off.userId);
    if (res.success) {
      alert("Deleted");
      window.location.reload();
    } else {
      alert(res.error || "Failed");
    }
    setOpenMenuId(null);
  };

  const filtered = useMemo(() => {
    if (!searchTerm.trim()) return initialOfficials;
    const q = searchTerm.toLowerCase().trim();
    return initialOfficials.filter(o =>
      (o.fullName || "").toLowerCase().includes(q) ||
      (o.email || "").toLowerCase().includes(q) ||
      (o.designation || "").toLowerCase().includes(q) ||
      (o.tel || "").includes(q) ||
      (o.tel2 || "").includes(q) ||
      (o.stationName || "").toLowerCase().includes(q)
    );
  }, [initialOfficials, searchTerm]);

  const totalItems = filtered.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / ITEMS_PER_PAGE));
  const paginated = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const start = (currentPage - 1) * ITEMS_PER_PAGE + 1;
  const end = Math.min(currentPage * ITEMS_PER_PAGE, totalItems);

  const handleCloseForm = () => {
    setFormOpen(false);
    setEditing(null);
  };

  return (
    <main className="p-6 min-h-screen bg-gray-50">
      <div className="flex flex-wrap gap-6 justify-between items-center mb-6">
        <div className="bg-[#C0A7A7]/90 backdrop-blur-sm p-5 rounded-xl shadow-lg min-w-[240px]">
          <h2 className="text-xl font-semibold text-gray-800">Total Team</h2>
          <span className="text-5xl font-bold text-gray-900">{initialCount}</span>
        </div>

        <div className="flex flex-wrap gap-4">
          <button
            onClick={() => { setEditing(null); setFormOpen(true); }}
            className="bg-[#6E1AF3] px-8 py-4 rounded-lg text-white font-semibold hover:bg-[#5a17d0] shadow-md"
          >
            Add Official
          </button>
          <button
            onClick={() => setViewDesignationsOpen(true)}
            className="bg-green-600 px-8 py-4 rounded-lg text-white font-semibold hover:bg-green-700 shadow-md"
          >
            View Designations
          </button>
        </div>
      </div>

      <div className="mb-6 max-w-2xl">
        <input
          type="text"
          placeholder="Search name, phone, designation, station..."
          value={searchTerm}
          onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }}
          className="w-full px-6 py-4 text-lg border border-gray-300 rounded-xl focus:ring-4 focus:ring-[#6E1AF3]/30 focus:border-[#6E1AF3] outline-none"
        />
      </div>

      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1100px]">
            <thead className="bg-gray-100 border-b">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 w-16">S/NO</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 w-24">Photo</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Name</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Designation</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Tel</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Tel 2</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Station</th>
                <th className="px-6 py-4 text-right text-sm font-semibold text-gray-700 w-32">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-16 text-center text-gray-500 text-lg">
                    {searchTerm ? "No matches" : "No officials yet"}
                  </td>
                </tr>
              ) : paginated.map((o, i) => {
                const sn = start + i;
                return (
                  <tr
                    key={o.userId}
                    className="hover:bg-gray-50 cursor-pointer"
                    onClick={() => handleEdit(o)}
                  >
                    <td className="px-6 py-4 text-sm font-medium text-gray-700">{sn}</td>

                    <td className="px-6 py-4">
                      {o.image ? (
                        <img
                          src={o.image}
                          alt={o.fullName || "Official"}
                          className="h-12 w-12 rounded-full object-cover border border-gray-300 shadow-sm"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = "/placeholder-user.jpg";
                          }}
                        />
                      ) : (
                        <div className="h-12 w-12 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 text-xs">
                          No photo
                        </div>
                      )}
                    </td>

                    <td className="px-6 py-4 font-medium text-gray-900">{o.fullName || "—"}</td>
                    <td className="px-6 py-4">
                      <span className="inline-block px-4 py-1.5 text-xs font-semibold text-white bg-[#6E1AF3] rounded-full">
                        {o.designation || "—"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{o.tel || "—"}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{o.tel2 || "—"}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{o.stationName || "—"}</td>

                    <td className="px-6 py-4 text-right" onClick={e => e.stopPropagation()}>
                      <button
                        onClick={e => {
                          e.stopPropagation();
                          toggleMenu(o.userId, e);
                        }}
                        className="p-2 rounded-lg hover:bg-gray-200"
                      >
                        ⋮
                      </button>

                      {openMenuId === o.userId && (
                        <div className="absolute right-6 mt-1 w-40 bg-white rounded-lg shadow-xl border z-50">
                          <button
                            onClick={() => handleEdit(o)}
                            className="block w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gray-100"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(o)}
                            className="block w-full text-left px-4 py-3 text-sm text-red-600 hover:bg-red-50"
                          >
                            Delete
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {totalItems > ITEMS_PER_PAGE && (
          <div className="px-6 py-5 flex flex-col sm:flex-row items-center justify-between border-t bg-gray-50">
            <div className="text-sm text-gray-600 mb-4 sm:mb-0">
              Showing <strong>{start}</strong>–<strong>{end}</strong> of <strong>{totalItems}</strong>
            </div>
            <div className="flex items-center gap-2">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                className="px-5 py-2.5 border rounded-lg text-sm font-medium disabled:opacity-50 hover:bg-gray-100"
              >
                Previous
              </button>
              <span className="px-4 py-2 text-sm font-medium text-gray-700">
                Page {currentPage} of {totalPages}
              </span>
              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                className="px-5 py-2.5 border rounded-lg text-sm font-medium disabled:opacity-50 hover:bg-gray-100"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {formOpen && (
        <>
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40" onClick={handleCloseForm} />
          <div className="fixed right-0 top-0 bottom-0 w-96 bg-white shadow-2xl z-50 overflow-y-auto">
            <AddOfficialForm
              users={initialUsers}
              stations={initialStations}
              designations={initialDesignations}
              onClose={handleCloseForm}
              initialOfficial={editing ? {
                userId: editing.userId,
                fullName: editing.fullName,
                designation: editing.designation,
                designationId: editing.designationId,
                tel: editing.tel,
                tel2: editing.tel2,
                stationId: editing.stationId,
                image: editing.image,
                user: { email: editing.email },
              } : null}
            />
          </div>
        </>
      )}

      {viewDesignationsOpen && (
        <ViewDesignations isOpen={viewDesignationsOpen} onClose={() => setViewDesignationsOpen(false)} />
      )}
    </main>
  );
}