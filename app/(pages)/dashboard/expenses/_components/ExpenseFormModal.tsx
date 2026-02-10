"use client";

import { useEffect } from "react";
import { useActionState } from "react";
import { saveExpenseAction } from "./actions";

type ActionState = {
  success?: boolean;
  error?: string;
};

type Mode = "add" | "edit" | "view";

interface Expense {
  id?: string;
  describe: string | null;
  amount: number;
}

interface Props {
  mode: Mode;
  expense?: Expense;
  onSuccess: () => void;
  onClose: () => void;
}

export default function ExpenseFormModal({ mode, expense, onSuccess, onClose }: Props) {
  const isView = mode === "view";

  const [state, submitAction, isPending] = useActionState<ActionState, FormData>(
    async (prevState, formData) => {
      const result = await saveExpenseAction(formData);
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
          {mode === "add" ? "Record New Expense" : mode === "edit" ? "Edit Expense" : "Expense Details"}
        </h3>
      </div>

      {state?.error && (
        <div className="bg-red-50 border border-red-300 text-red-700 px-6 py-4 rounded-xl text-center font-semibold">
          {state.error}
        </div>
      )}

      {expense?.id && <input type="hidden" name="expenseId" value={expense.id} />}

      <div>
        <label className="block text-lg font-semibold text-gray-800 mb-2">
          Description <span className="text-red-600">*</span>
        </label>
        <textarea
          required
          name="describe"
          rows={5}
          defaultValue={expense?.describe ?? ""}
          readOnly={isView}
          className="w-full px-5 py-4 bg-gray-50 border-2 border-gray-300 rounded-xl disabled:bg-gray-100 resize-none"
          placeholder="e.g. Water payment – February"
        />
      </div>

      <div>
        <label className="block text-lg font-semibold text-gray-800 mb-2">
          Amount (KES) <span className="text-red-600">*</span>
        </label>
        <input
          required
          type="number"
          name="amount"
          min="1"
          step="1"
          defaultValue={expense?.amount ?? ""}
          readOnly={isView}
          className="w-full px-5 py-4 bg-gray-50 border-2 border-gray-300 rounded-xl disabled:bg-gray-100"
          placeholder="9000"
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
            {isPending ? "Saving..." : mode === "add" ? "Add Expense" : "Update Expense"}
          </button>
        )}
      </div>
    </form>
  );
}