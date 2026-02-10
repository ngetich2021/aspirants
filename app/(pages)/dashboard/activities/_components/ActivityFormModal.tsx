"use client";

import { useEffect } from "react";
import { useActionState } from "react";
import { saveActivityAction } from "./actions";

type ActionState = {
  success?: boolean;
  error?: string;
};

type Mode = "add" | "edit" | "view";

interface Activity {
  id?: string;
  name: string;
  description: string;
  supervisor: string;
  status: string;
  image?: string | null;
}

interface ActivityFormModalProps {
  mode: Mode;
  activity?: Activity;
  officials: string[];
  onSuccess: () => void;
  onClose: () => void;
}

export default function ActivityFormModal({
  mode,
  activity,
  officials,
  onSuccess,
  onClose,
}: ActivityFormModalProps) {
  const isView = mode === "view";

  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    async (_prevState, formData) => {
      const result = await saveActivityAction(formData);
      return result as ActionState;
    },
    { success: false }
  );

  useEffect(() => {
    if (state?.success) {
      onSuccess();
    }
  }, [state?.success, onSuccess]);

  return (
    <form action={formAction} className="p-6 space-y-6">
      <h2 className="text-2xl font-bold text-center">
        {mode === "add" ? "Add Activity" : mode === "edit" ? "Edit Activity" : "View Activity"}
      </h2>

      {state?.error && (
        <div className="bg-red-100 text-red-700 p-4 rounded">
          {state.error}
        </div>
      )}

      {activity?.id && <input type="hidden" name="activityId" value={activity.id} />}

      <div>
        <label className="block mb-1 font-medium">Name *</label>
        <input
          required
          name="name"
          type="text"
          defaultValue={activity?.name ?? ""}
          readOnly={isView}
          className="w-full p-3 border rounded disabled:bg-gray-100"
        />
      </div>

      <div>
        <label className="block mb-1 font-medium">Description *</label>
        <textarea
          required
          name="description"
          rows={3}
          defaultValue={activity?.description ?? ""}
          readOnly={isView}
          className="w-full p-3 border rounded disabled:bg-gray-100"
        />
      </div>

      <div>
        <label className="block mb-1 font-medium">Supervisor *</label>
        {isView ? (
          <div className="w-full p-3 border rounded bg-gray-100 text-gray-800">
            {activity?.supervisor || "—"}
          </div>
        ) : (
          <select
            required
            name="supervisor"
            defaultValue={activity?.supervisor ?? ""}
            className="w-full p-3 border rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            <option value="" disabled>
              Select supervisor...
            </option>
            {officials.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        )}
      </div>

      <div>
        <label className="block mb-1 font-medium">Status</label>
        <select
          name="status"
          defaultValue={activity?.status ?? "pending"}
          disabled={isView}
          className="w-full p-3 border rounded disabled:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-purple-500 capitalize"
        >
          <option value="pending">Pending</option>
          <option value="in progress">In Progress</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
          <option value="on hold">On Hold</option>
        </select>
      </div>

      <div>
        <label className="block mb-1 font-medium">
          Image {mode === "add" && <span className="text-red-600">*</span>}
        </label>

        {activity?.image && mode === "view" && (
          <div className="mt-2">
            <img
              src={activity.image}
              alt="Activity preview"
              className="max-h-40 object-contain rounded border border-gray-200"
            />
          </div>
        )}

        {!isView && (
          <input
            type="file"
            name="image"
            accept="image/*"
            required={mode === "add"}
            className="w-full p-2 border rounded mt-1"
          />
        )}
      </div>

      <div className="flex gap-4 mt-8">
        <button
          type="button"
          onClick={onClose}
          className="flex-1 bg-gray-300 p-4 rounded font-bold hover:bg-gray-400 transition"
        >
          Cancel
        </button>

        {!isView && (
          <button
            type="submit"
            disabled={pending}
            className="flex-1 bg-purple-600 text-white p-4 rounded font-bold disabled:bg-purple-300 disabled:cursor-not-allowed transition"
          >
            {pending ? "Saving..." : mode === "add" ? "Add" : "Update"}
          </button>
        )}
      </div>
    </form>
  );
}