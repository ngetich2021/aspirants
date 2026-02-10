"use client";

import { useEffect } from "react";
import { useActionState } from "react";
import { savePollingStationAction } from "./actions";

type ActionState = {
  success?: boolean;
  error?: string;
};

type Mode = "add" | "edit" | "view";

interface PollingStation {
  id?: string;
  name: string;
  county: string;
  subCounty: string;
  ward: string;
  votes: number;
}

interface Props {
  mode: Mode;
  station?: PollingStation;
  onSuccess: () => void;
  onClose: () => void;
}

export default function PollingStationFormModal({ mode, station, onSuccess, onClose }: Props) {
  const isView = mode === "view";

  const [state, submitAction, isPending] = useActionState<ActionState, FormData>(
    async (prevState, formData) => {
      const result = await savePollingStationAction(formData);
      return result;
    },
    { success: false }
  );

  useEffect(() => {
    if (state?.success) {
      onSuccess();
    }
  }, [state?.success, onSuccess]);

  return (
    <form action={submitAction} className="grid grid-cols-1 gap-7 p-8">
      <div className="text-center mb-6">
        <h3 className="text-3xl font-bold text-gray-900">
          {mode === "add" ? "Add New Polling Station" : mode === "edit" ? "Edit Polling Station" : "Polling Station Details"}
        </h3>
      </div>

      {state?.error && (
        <div className="bg-red-50 border border-red-300 text-red-700 px-6 py-4 rounded-xl text-center font-semibold">
          {state.error}
        </div>
      )}

      {station?.id && <input type="hidden" name="stationId" value={station.id} />}

      <div>
        <label className="block text-lg font-semibold text-gray-800 mb-2">
          Polling Station ID <span className="text-red-600">*</span>
        </label>
        <input
          required
          name="stationId"
          type="text"
          defaultValue={station?.id ?? ""}
          readOnly={mode !== "add"}
          className="w-full px-5 py-4 bg-gray-50 border-2 border-gray-300 rounded-xl disabled:bg-gray-100 disabled:text-gray-500"
          placeholder="e.g. 0470321 or PS-KAS-001"
        />
      </div>

      <div>
        <label className="block text-lg font-semibold text-gray-800 mb-2">
          Name <span className="text-red-600">*</span>
        </label>
        <input
          required
          name="name"
          type="text"
          defaultValue={station?.name ?? ""}
          readOnly={isView}
          className="w-full px-5 py-4 bg-gray-50 border-2 border-gray-300 rounded-xl disabled:bg-gray-100 disabled:text-gray-500"
          placeholder="e.g. Kasar Primary School"
        />
      </div>

      <div>
        <label className="block text-lg font-semibold text-gray-800 mb-2">
          County <span className="text-red-600">*</span>
        </label>
        <input
          required
          name="county"
          type="text"
          defaultValue={station?.county ?? ""}
          readOnly={isView}
          className="w-full px-5 py-4 bg-gray-50 border-2 border-gray-300 rounded-xl disabled:bg-gray-100"
          placeholder="e.g. Elgeyo-Marakwet"
        />
      </div>

      <div>
        <label className="block text-lg font-semibold text-gray-800 mb-2">
          Sub-County <span className="text-red-600">*</span>
        </label>
        <input
          required
          name="subCounty"
          type="text"
          defaultValue={station?.subCounty ?? ""}
          readOnly={isView}
          className="w-full px-5 py-4 bg-gray-50 border-2 border-gray-300 rounded-xl disabled:bg-gray-100"
          placeholder="e.g. Marakwet West"
        />
      </div>

      <div>
        <label className="block text-lg font-semibold text-gray-800 mb-2">
          Ward <span className="text-red-600">*</span>
        </label>
        <input
          required
          name="ward"
          type="text"
          defaultValue={station?.ward ?? ""}
          readOnly={isView}
          className="w-full px-5 py-4 bg-gray-50 border-2 border-gray-300 rounded-xl disabled:bg-gray-100"
          placeholder="e.g. Sambirir"
        />
      </div>

      <div>
        <label className="block text-lg font-semibold text-gray-800 mb-2">Votes</label>
        <input
          name="votes"
          type="number"
          min="0"
          defaultValue={station?.votes ?? 0}
          readOnly={isView}
          className="w-full px-5 py-4 bg-gray-50 border-2 border-gray-300 rounded-xl disabled:bg-gray-100"
          placeholder="e.g. 450"
        />
      </div>

      <div className="mt-8 flex gap-4">
        <button
          type="button"
          onClick={onClose}
          className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold text-xl py-5 rounded-xl transition"
        >
          Cancel
        </button>

        {!isView && (
          <button
            type="submit"
            disabled={isPending}
            className="flex-1 bg-[#6E1AF3] hover:bg-purple-700 disabled:bg-purple-400 disabled:cursor-not-allowed text-white font-bold text-xl py-5 rounded-xl transition"
          >
            {isPending ? "Saving..." : mode === "add" ? "Add Station" : "Update Station"}
          </button>
        )}
      </div>
    </form>
  );
}