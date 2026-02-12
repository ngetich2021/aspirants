"use client";

import { format } from "date-fns";
import { Trash2, Plus } from "lucide-react";
import { deleteReportAction } from "./actions";

interface Report {
  id: string;
  report: string;
  createdAt: Date;
}

// Define Props interface here (this was missing or incomplete)
interface ReportsModalProps {
  activityId: string;
  activityName: string;
  reports: Report[];               // ← this line was missing
  onClose: () => void;
  onAddNew: () => void;
  onReportDeleted: () => Promise<void>;  // or () => void if you don't await it
}

export default function ReportsModal({
  activityId,
  activityName,
  reports,
  onClose,
  onAddNew,
  onReportDeleted,
}: ReportsModalProps) {
  const handleDelete = async (id: string) => {
    if (!confirm("Delete this report?")) return;

    const result = await deleteReportAction(id);

    if (result.success) {
      onReportDeleted();   // this will trigger refreshReports in parent
    } else {
      alert(result.error || "Failed to delete report");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-lg bg-white h-full shadow-2xl flex flex-col overflow-hidden">
        <div className="sticky top-0 z-10 bg-white border-b px-6 py-5 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold">Reports</h2>
            <p className="text-sm text-gray-600 mt-1 truncate max-w-[320px]">
              {activityName}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-3xl text-gray-500 hover:text-gray-700 leading-none"
          >
            ×
          </button>
        </div>

        <div className="p-6 flex-1 overflow-y-auto">
          {reports.length === 0 ? (
            <div className="py-12 text-center text-gray-500">
              No reports submitted yet for this activity.
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 uppercase text-xs tracking-wider sticky top-0 z-10">
                <tr>
                  <th className="px-4 py-3 text-left">S/NO</th>
                  <th className="px-4 py-3 text-left">Report</th>
                  <th className="px-4 py-3 text-left">Date</th>
                  <th className="px-4 py-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {reports.map((r, i) => (
                  <tr key={r.id} className="hover:bg-gray-50">
                    <td className="px-4 py-4">{i + 1}</td>
                    <td className="px-4 py-4 max-w-xs">
                      <div className="line-clamp-4 whitespace-pre-wrap">{r.report}</div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      {format(r.createdAt, "dd-MM-yy HH:mm")}
                    </td>
                    <td className="px-4 py-4 text-center">
                      <button
                        onClick={() => handleDelete(r.id)}
                        className="p-1.5 text-red-600 hover:bg-red-50 rounded-full transition"
                        title="Delete report"
                      >
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="border-t px-6 py-4 flex justify-between items-center">
          <button
            onClick={onAddNew}
            className="flex items-center gap-2 px-5 py-2.5 bg-purple-600 text-white rounded font-medium hover:bg-purple-700 transition"
          >
            <Plus size={18} /> Add Report
          </button>
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-gray-200 hover:bg-gray-300 rounded font-medium transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}