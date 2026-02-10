'use client';

import { useState } from "react";
import { saveOfficialAction } from "./actionsTeam";
import Image from "next/image";

type User = { id: string; email: string };
type Station = { id: string; name: string };
type Designation = { id: string; name: string };

interface Props {
  users: User[];
  stations: Station[];
  designations: Designation[];
  onClose: () => void;
  initialOfficial?: {
    userId: string;
    fullName: string | null;
    designation: string | null;
    designationId: string | null;
    tel: string | null;
    tel2: string | null;
    stationId: string | null;
    image: string | null;
    user: { email: string | null };
  } | null;
}

export default function AddOfficialForm({ users, stations, designations, onClose, initialOfficial }: Props) {
  const isEdit = !!initialOfficial;

  const [selectedEmail, setSelectedEmail] = useState(initialOfficial?.user.email || "");
  const [form, setForm] = useState({
    fullName: initialOfficial?.fullName || "",
    designationId: initialOfficial?.designationId || "",
    tel: initialOfficial?.tel || "",
    tel2: initialOfficial?.tel2 || "",
    stationId: initialOfficial?.stationId || "",
  });

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getUserId = () => users.find(u => u.email === selectedEmail)?.id || initialOfficial?.userId || "";

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const data = new FormData(e.currentTarget);
    data.set("userId", getUserId());

    try {
      const res = await saveOfficialAction(data);
      if (res.success) {
        alert(isEdit ? "Updated" : "Added");
        onClose();
      } else {
        setError(res.error || "Failed");
      }
    } catch {
      setError("Error saving");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="relative p-8 h-full overflow-y-auto">
      <button
        onClick={onClose}
        className="absolute top-6 left-6 w-10 h-10 flex items-center justify-center bg-white rounded-full shadow border text-2xl text-gray-600 hover:text-black z-10"
      >
        ←
      </button>

      <h2 className="text-2xl font-bold text-gray-900 mb-10 pl-12">
        {isEdit ? "Edit Official" : "Add Official"}
      </h2>

      {error && <div className="text-red-600 mb-6 p-3 bg-red-50 rounded">{error}</div>}

      <form onSubmit={handleSubmit} className="space-y-6">
        <input type="hidden" name="userId" value={getUserId()} />

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">User <span className="text-red-500">*</span></label>
          <select
            value={selectedEmail}
            onChange={e => setSelectedEmail(e.target.value)}
            required
            className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-[#6E1AF3]"
          >
            <option value="">Select user</option>
            {users.map(u => <option key={u.id} value={u.email}>{u.email}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Full Name <span className="text-red-500">*</span></label>
          <input
            name="fullName"
            value={form.fullName}
            onChange={e => setForm({ ...form, fullName: e.target.value })}
            required
            className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-[#6E1AF3]"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Designation <span className="text-red-500">*</span></label>
          <select
            name="designation"
            value={form.designationId}
            onChange={e => setForm({ ...form, designationId: e.target.value })}
            required
            className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-[#6E1AF3]"
          >
            <option value="">Select designation</option>
            {designations.map(d => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Primary Phone <span className="text-red-500">*</span></label>
          <input
            name="tel"
            type="tel"
            value={form.tel}
            onChange={e => setForm({ ...form, tel: e.target.value })}
            required
            className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-[#6E1AF3]"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Secondary Phone</label>
          <input
            name="tel2"
            type="tel"
            value={form.tel2}
            onChange={e => setForm({ ...form, tel2: e.target.value })}
            className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-[#6E1AF3]"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Polling Station <span className="text-red-500">*</span></label>
          <select
            name="station"
            value={form.stationId}
            onChange={e => setForm({ ...form, stationId: e.target.value })}
            required
            className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-[#6E1AF3]"
          >
            <option value="">Select station</option>
            {stations.map(s => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Profile Photo <span className="text-red-500">*</span>
          </label>
          <input
            type="file"
            name="image"
            accept="image/jpeg,image/png,image/webp"
            required={!isEdit}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100"
          />
          {isEdit && initialOfficial?.image && (
            <div className="mt-3">
              <p className="text-sm text-gray-500">Current photo:</p>
              <Image
                src={initialOfficial.image}
                alt="Current official photo"
                className="mt-2 h-20 w-20 object-cover rounded-md border shadow-sm"
                width={20}
                height={20}
              />
              <p className="text-xs text-gray-500 mt-1">Upload new to replace</p>
            </div>
          )}
        </div>

        <div className="flex gap-4 pt-8">
          <button type="button" onClick={onClose} className="flex-1 py-3 border rounded-lg hover:bg-gray-50">
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="flex-1 py-3 bg-[#6E1AF3] text-white rounded-lg hover:bg-[#5a17d0] disabled:opacity-50"
          >
            {submitting ? "Saving..." : isEdit ? "Update" : "Add"}
          </button>
        </div>
      </form>
    </div>
  );
}