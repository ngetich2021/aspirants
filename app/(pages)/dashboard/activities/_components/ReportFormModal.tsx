"use client";

import { useActionState, useEffect } from "react";
import { saveReportAction } from "./actions";

export type ActionResult =
  | { success: true }
  | { success: false; error: string };

interface Props {
  activityId: string;
  activityName: string;
  onSuccess: () => void;
  onClose: () => void;
}

export default function ReportFormModal({
  activityId,
  activityName,
  onSuccess,
  onClose,
}: Props) {
  const [state, formAction, pending] = useActionState<ActionResult, FormData>(
    async (_prevState: ActionResult, formData: FormData): Promise<ActionResult> => {
      return await saveReportAction(formData);
    },
    { success: false, error: "" } // ← correct initial shape
  );

  useEffect(() => {
    if (state.success) {
      onSuccess();
    }
  }, [state, onSuccess]); // ← depend on whole state (safer)

  return (
    <form action={formAction} className="space-y-6">
      <h2 className="text-2xl font-bold text-center">Add Report</h2>
      <p className="text-center text-gray-600 truncate px-4">{activityName}</p>

      {state.success === false && state.error && (
        <div className="bg-red-100 text-red-700 p-4 rounded-lg">{state.error}</div>
      )}

      <input type="hidden" name="activityId" value={activityId} />

      <div>
        <label className="block mb-2 font-medium text-gray-700">
          Report Details <span className="text-red-600">*</span>
        </label>
        <textarea
          name="report"
          rows={7}
          required
          placeholder="Enter observations, findings, issues, recommendations..."
          className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
        />
      </div>

      <div className="flex gap-4 mt-10">
        <button
          type="button"
          onClick={onClose}
          className="flex-1 bg-gray-300 hover:bg-gray-400 p-4 rounded-lg font-bold transition"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={pending}
          className="flex-1 bg-purple-600 text-white p-4 rounded-lg font-bold disabled:bg-purple-400 disabled:cursor-not-allowed transition"
        >
          {pending ? "Submitting..." : "Submit Report"}
        </button>
      </div>
    </form>
  );
}