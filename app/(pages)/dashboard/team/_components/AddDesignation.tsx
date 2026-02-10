'use client';

import { useTransition } from 'react';
import { addDesignationAction, editDesignationAction } from './actionsTeam';

interface Designation {
  id: string;
  name: string;
  description: string | null;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  initialData?: Designation | null;
  onSuccess?: () => void | Promise<void>;
}

export default function AddDesignation({
  isOpen,
  onClose,
  initialData = null,
  onSuccess,
}: Props) {
  const [isPending, startTransition] = useTransition();
  const isEdit = !!initialData && !!initialData.id;

  if (!isOpen) return null;

  async function handleAction(formData: FormData) {
    startTransition(async () => {
      try {
        let result;

        if (isEdit) {
          if (!initialData.id) throw new Error("Missing designation ID for edit");
          formData.set('id', initialData.id);
          result = await editDesignationAction(formData);
        } else {
          result = await addDesignationAction(formData);
        }

        if (result?.success) {
          console.log(isEdit ? "Edit successful" : "Add successful");
          await onSuccess?.();
          onClose();
        } else {
          console.error("Server action failed:", result?.error);
          alert(result?.error || "Operation failed – check console");
        }
      } catch (err) {
        console.error("Client-side error in designation save:", err);
        alert("Something went wrong – check console for details");
      }
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 text-gray-500 hover:text-gray-900 transition"
          aria-label="Close"
        >
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="px-8 py-10">
          <h2 className="text-2xl font-bold text-gray-900 mb-8">
            {isEdit ? 'Edit Designation' : 'Add New Designation'}
          </h2>

          <form action={handleAction} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Name <span className="text-red-600">*</span>
              </label>
              <input
                name="name"
                defaultValue={initialData?.name ?? ''}
                required
                autoFocus
                placeholder="e.g. Presiding Officer"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-purple-600 outline-none transition"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Description
              </label>
              <textarea
                name="description"
                defaultValue={initialData?.description ?? ''}
                rows={4}
                placeholder="Optional description or responsibilities..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-purple-600 outline-none resize-none transition"
              />
            </div>

            <div className="flex gap-4 pt-6">
              <button
                type="submit"
                disabled={isPending}
                className={`px-6 py-3 text-white font-medium rounded-lg transition ${
                  isPending
                    ? 'bg-purple-400 cursor-not-allowed'
                    : 'bg-purple-700 hover:bg-purple-800'
                }`}
              >
                {isPending
                  ? 'Saving...'
                  : isEdit
                  ? 'Save Changes'
                  : 'Add Designation'}
              </button>

              <button
                type="button"
                onClick={onClose}
                disabled={isPending}
                className="px-6 py-3 bg-gray-200 text-gray-800 font-medium rounded-lg hover:bg-gray-300 transition disabled:opacity-50"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}