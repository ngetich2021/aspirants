'use client';

import { useEffect, useState } from 'react';
import AddDesignation from './AddDesignation';
import { deleteDesignationAction, getDesignationsAction } from './actionsTeam';

interface Designation {
  id: string;
  name: string;
  description: string | null;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export default function ViewDesignations({ isOpen, onClose }: Props) {
  const [designations, setDesignations] = useState<Designation[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal control
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editItem, setEditItem] = useState<Designation | null>(null); // null → create new

  useEffect(() => {
    if (!isOpen) return;

    const fetchData = async () => {
      setLoading(true);
      try {
        const data = await getDesignationsAction();
        setDesignations(data ?? []);
      } catch (err) {
        console.error('Failed to load designations:', err);
        setDesignations([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [isOpen]);

  const refreshDesignations = async () => {
    try {
      const updated = await getDesignationsAction();
      setDesignations(updated ?? []);
    } catch (err) {
      console.error('Refresh failed:', err);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete designation "${name}"? This cannot be undone.`)) return;

    try {
      const formData = new FormData();
      formData.append('id', id);
      const result = await deleteDesignationAction(formData);

      if (result.success) {
        await refreshDesignations();
      } else {
        alert(result.error || 'Delete failed');
      }
    } catch (err) {
      console.error('Delete error:', err);
      alert('Failed to delete designation');
    }
  };

  const openModalForCreate = () => {
    setEditItem(null);
    setIsModalOpen(true);
  };

  const openModalForEdit = (designation: Designation) => {
    setEditItem(designation);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditItem(null);
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/40 z-40" onClick={onClose} />

      {/* Sidebar panel */}
      <div className="fixed inset-y-0 right-0 top-20 w-full max-w-md bg-white shadow-2xl z-50 flex flex-col">
        <div className="flex items-center justify-between p-5 border-b">
          <h2 className="text-xl font-semibold text-gray-900">Designations</h2>
          <button
            onClick={onClose}
            className="text-2xl leading-none text-gray-600 hover:text-gray-900"
          >
            ×
          </button>
        </div>

        <div className="p-5 flex-1 overflow-auto">
          <div className="mb-6">
            <button
              onClick={openModalForCreate}
              className="px-4 py-2 bg-purple-700 text-white font-medium rounded-lg hover:bg-purple-800 transition text-sm"
            >
              + Add New Designation
            </button>
          </div>

          {loading ? (
            <div className="text-center py-12 text-gray-500">Loading designations...</div>
          ) : designations.length === 0 ? (
            <div className="text-center py-12 text-gray-500">No designations found</div>
          ) : (
            <table className="w-full text-sm border-collapse">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-gray-700">Name</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-700 hidden sm:table-cell">
                    Description
                  </th>
                  <th className="px-4 py-3 text-center font-medium text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {designations.map((d) => (
                  <tr key={d.id} className="border-b hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900">{d.name}</div>
                      <div className="text-gray-500 text-xs sm:hidden mt-1">
                        {d.description || '—'}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-600 hidden sm:table-cell">
                      {d.description || '—'}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-4">
                        <button
                          onClick={() => openModalForEdit(d)}
                          className="text-blue-600 hover:text-blue-800 font-medium text-sm"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(d.id, d.name)}
                          className="text-red-600 hover:text-red-800 font-medium text-sm"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Add / Edit Modal */}
      <AddDesignation
        isOpen={isModalOpen}
        onClose={closeModal}
        initialData={editItem}
        onSuccess={async () => {
          await refreshDesignations();
          closeModal();
        }}
      />
    </>
  );
}