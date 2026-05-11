"use client";

import { useState, useTransition, useMemo } from "react";
import Image from "next/image";
import {
  type AdminRole,
  ROLE_LABELS,
  ROLE_COLORS,
  getCreatableRoles,
  SECTIONS,
  SECTION_LABELS,
  type Section,
} from "@/lib/rbac";
import { assignAdminRoleAction, removeAdminRoleAction, updatePermissionsAction } from "./actions";

type UserRow = {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
  profile: {
    role: string | null;
    adminRole: string | null;
    fullName: string | null;
    adminCounty: string | null;
    adminSubCounty: string | null;
    adminWard: string | null;
    pollingStationId: string | null;
    permissions: string | null;
    pollingStation: { name: string } | null;
  } | null;
};

type SubCountyItem = { county: string; subCounty: string };
type WardItem = { county: string; subCounty: string; ward: string };
type StationItem = { id: string; name: string; county: string; subCounty: string; ward: string };

interface Props {
  users: UserRow[];
  managerRole: AdminRole;
  managerScope: {
    adminCounty: string | null;
    adminSubCounty: string | null;
    adminWard: string | null;
    pollingStationId: string | null;
  };
  counties: string[];
  subCounties: SubCountyItem[];
  wards: WardItem[];
  stations: StationItem[];
}

// Non-admin sections that can be assigned (voters is open to all)
const ASSIGNABLE_SECTIONS = SECTIONS.filter((s) => s !== "voters") as Section[];

export default function AdminClient({
  users,
  managerRole,
  managerScope,
  counties,
  subCounties,
  wards,
  stations,
}: Props) {
  const [search, setSearch] = useState("");
  const [usersPerPage, setUsersPerPage] = useState(20);
  const [currentPage, setCurrentPage] = useState(1);

  // Role modal state
  const [modalUser, setModalUser] = useState<UserRow | null>(null);
  const [selectedRole, setSelectedRole] = useState<AdminRole>("county_admin");
  const [selectedCounty, setSelectedCounty] = useState(managerScope.adminCounty ?? "");
  const [selectedSubCounty, setSelectedSubCounty] = useState("");
  const [selectedWard, setSelectedWard] = useState("");
  const [selectedStation, setSelectedStation] = useState("");
  const [roleMessage, setRoleMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Permissions modal state
  const [permUser, setPermUser] = useState<UserRow | null>(null);
  const [selectedPerms, setSelectedPerms] = useState<Section[]>([]);
  const [permMessage, setPermMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const [isPending, startTransition] = useTransition();

  const creatableRoles = getCreatableRoles(managerRole);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return users;
    return users.filter(
      (u) =>
        u.name?.toLowerCase().includes(q) ||
        u.email?.toLowerCase().includes(q) ||
        u.profile?.fullName?.toLowerCase().includes(q) ||
        u.profile?.adminRole?.toLowerCase().includes(q)
    );
  }, [users, search]);

  const paged = filtered.slice((currentPage - 1) * usersPerPage, currentPage * usersPerPage);
  const totalPages = Math.max(1, Math.ceil(filtered.length / usersPerPage));

  const filteredSubCounties = useMemo(
    () => subCounties.filter((s) => s.county === selectedCounty),
    [subCounties, selectedCounty]
  );

  const filteredWards = useMemo(
    () => wards.filter((w) => w.county === selectedCounty && w.subCounty === selectedSubCounty),
    [wards, selectedCounty, selectedSubCounty]
  );

  const filteredStations = useMemo(() => {
    if (selectedRole === "pollingstation_admin") {
      return stations.filter(
        (s) =>
          (!selectedCounty || s.county === selectedCounty) &&
          (!selectedSubCounty || s.subCounty === selectedSubCounty) &&
          (!selectedWard || s.ward === selectedWard)
      );
    }
    return [];
  }, [stations, selectedRole, selectedCounty, selectedSubCounty, selectedWard]);

  // ── Role modal ──────────────────────────────────────────────────────────────

  function openRoleModal(user: UserRow) {
    setModalUser(user);
    setSelectedRole(creatableRoles[0] ?? "county_admin");
    setSelectedCounty(managerScope.adminCounty ?? "");
    setSelectedSubCounty(managerScope.adminSubCounty ?? "");
    setSelectedWard(managerScope.adminWard ?? "");
    setSelectedStation("");
    setRoleMessage(null);
  }

  function closeRoleModal() {
    setModalUser(null);
    setRoleMessage(null);
  }

  function handleAssign(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const res = await assignAdminRoleAction(formData);
      if ("error" in res) {
        setRoleMessage({ type: "error", text: res.error });
      } else {
        setRoleMessage({ type: "success", text: "Role assigned successfully!" });
        setTimeout(closeRoleModal, 1200);
      }
    });
  }

  function handleRemove(userId: string) {
    if (!confirm("Remove this user's admin role?")) return;
    startTransition(async () => {
      const res = await removeAdminRoleAction(userId);
      if ("error" in res) alert(res.error);
    });
  }

  // ── Permissions modal ───────────────────────────────────────────────────────

  function openPermModal(user: UserRow) {
    const existing: Section[] = user.profile?.permissions
      ? (JSON.parse(user.profile.permissions) as Section[])
      : [];
    setPermUser(user);
    setSelectedPerms(existing);
    setPermMessage(null);
  }

  function closePermModal() {
    setPermUser(null);
    setPermMessage(null);
  }

  function togglePerm(section: Section) {
    setSelectedPerms((prev) =>
      prev.includes(section) ? prev.filter((s) => s !== section) : [...prev, section]
    );
  }

  function handlePermSave() {
    if (!permUser) return;
    startTransition(async () => {
      const res = await updatePermissionsAction(permUser.id, selectedPerms);
      if ("error" in res) {
        setPermMessage({ type: "error", text: res.error });
      } else {
        setPermMessage({ type: "success", text: "Permissions saved!" });
        setTimeout(closePermModal, 1000);
      }
    });
  }

  const adminCount = users.filter(
    (u) => u.profile?.adminRole && u.profile.adminRole !== "user"
  ).length;

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-6">

        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Admin Management</h1>
          <p className="text-sm text-gray-500 mt-1">
            You are logged in as{" "}
            <span className={`inline-block px-2 py-0.5 rounded text-xs font-bold ${ROLE_COLORS[managerRole]}`}>
              {ROLE_LABELS[managerRole]}
            </span>
            {managerScope.adminCounty && ` · ${managerScope.adminCounty}`}
            {managerScope.adminSubCounty && ` › ${managerScope.adminSubCounty}`}
            {managerScope.adminWard && ` › ${managerScope.adminWard}`}
          </p>
        </div>

        {/* Stats bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          {[
            { label: "Total Users", value: users.length, color: "blue" },
            { label: "Active Admins", value: adminCount, color: "purple" },
            { label: "Counties", value: counties.length, color: "green" },
            { label: "Polling Stations", value: stations.length, color: "orange" },
          ].map(({ label, value, color }) => (
            <div key={label} className={`bg-white border-l-4 border-${color}-500 rounded shadow-sm p-4`}>
              <div className="text-2xl font-bold text-gray-800">{value}</div>
              <div className="text-xs text-gray-500 uppercase tracking-wide">{label}</div>
            </div>
          ))}
        </div>

        {/* Search + table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="flex flex-col sm:flex-row gap-3 p-4 border-b bg-gray-50 items-center justify-between">
            <input
              type="text"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
              placeholder="Search by name, email or role..."
              className="w-full sm:max-w-xs px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 outline-none"
            />
            <div className="flex items-center gap-3">
              <label className="text-sm text-gray-600 whitespace-nowrap">Show</label>
              <select
                value={usersPerPage}
                onChange={(e) => { setUsersPerPage(Number(e.target.value)); setCurrentPage(1); }}
                className="px-2 py-1.5 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-purple-500 outline-none"
              >
                {[20, 50, 100, 200].map((n) => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
              <span className="text-sm text-gray-500">{filtered.length} users</span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-100 text-xs uppercase text-gray-600">
                <tr>
                  <th className="px-4 py-3 sticky left-0 z-20 bg-gray-100">User</th>
                  <th className="px-4 py-3">Admin Role</th>
                  <th className="px-4 py-3">Scope</th>
                  <th className="px-4 py-3">Sections</th>
                  <th className="px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-gray-400">
                      No users found
                    </td>
                  </tr>
                ) : (
                  paged.map((user) => {
                    const ar = (user.profile?.adminRole || "user") as AdminRole;
                    const isActive = ar !== "user";
                    const isAnyAdmin = ar !== "user";
                    const perms: Section[] = user.profile?.permissions
                      ? (JSON.parse(user.profile.permissions) as Section[])
                      : [];

                    return (
                      <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3 sticky left-0 z-10 bg-white">
                          <div className="flex items-center gap-3">
                            <div className="h-9 w-9 relative rounded-full overflow-hidden ring-2 ring-gray-100 flex-shrink-0">
                              <Image
                                src={user.image || "/default-avatar.png"}
                                alt={user.name || "user"}
                                fill
                                className="object-cover"
                              />
                            </div>
                            <div>
                              <div className="font-medium text-gray-900">
                                {user.profile?.fullName || user.name || "—"}
                              </div>
                              <div className="text-xs text-gray-400">{user.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-block px-2 py-0.5 rounded text-xs font-semibold ${ROLE_COLORS[ar] || ROLE_COLORS.user}`}>
                            {ROLE_LABELS[ar] || ar}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-600">
                          {ar === "county_admin" && user.profile?.adminCounty}
                          {ar === "subcounty_admin" && `${user.profile?.adminCounty} › ${user.profile?.adminSubCounty}`}
                          {ar === "ward_admin" && `${user.profile?.adminCounty} › ${user.profile?.adminSubCounty} › ${user.profile?.adminWard}`}
                          {ar === "pollingstation_admin" && (user.profile?.pollingStation?.name || user.profile?.pollingStationId)}
                          {ar === "super_admin" && <span className="text-red-600 font-bold">All Kenya</span>}
                          {!isActive && "—"}
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-600">
                          {isAnyAdmin ? (
                            <span className="text-green-600 font-semibold">All sections</span>
                          ) : perms.length === 0 ? (
                            <span className="text-gray-400">Voters only</span>
                          ) : (
                            <div className="flex flex-wrap gap-1">
                              {perms.map((s) => (
                                <span key={s} className="bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded text-[10px] font-medium">
                                  {SECTION_LABELS[s]}
                                </span>
                              ))}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-2 flex-wrap">
                            {creatableRoles.length > 0 && (
                              <button
                                onClick={() => openRoleModal(user)}
                                className="px-3 py-1 text-xs font-medium bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors"
                              >
                                Role
                              </button>
                            )}
                            {!isAnyAdmin && (
                              <button
                                onClick={() => openPermModal(user)}
                                className="px-3 py-1 text-xs font-medium bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                              >
                                Sections
                              </button>
                            )}
                            {isActive && ar !== "super_admin" && (
                              <button
                                onClick={() => handleRemove(user.id)}
                                disabled={isPending}
                                className="px-3 py-1 text-xs font-medium bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors disabled:opacity-50"
                              >
                                Remove
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {filtered.length > 0 && (
            <div className="px-4 py-3 border-t bg-gray-50 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-gray-600">
              <div>
                Showing{" "}
                <span className="font-medium">{(currentPage - 1) * usersPerPage + 1}</span>–
                <span className="font-medium">{Math.min(currentPage * usersPerPage, filtered.length)}</span>{" "}
                of <span className="font-medium">{filtered.length}</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-4 py-1.5 border rounded text-sm disabled:opacity-50 hover:bg-gray-100"
                >
                  Prev
                </button>
                <span className="font-medium">
                  {currentPage} / {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage >= totalPages}
                  className="px-4 py-1.5 border rounded text-sm disabled:opacity-50 hover:bg-gray-100"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Assign Role Modal ─────────────────────────────────────────────────── */}
      {modalUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
            <div className="p-6">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-lg font-bold text-gray-900">Assign Admin Role</h2>
                <button onClick={closeRoleModal} className="text-gray-400 hover:text-gray-700 text-2xl leading-none">&times;</button>
              </div>

              <div className="flex items-center gap-3 mb-5 p-3 bg-gray-50 rounded-lg">
                <div className="h-10 w-10 relative rounded-full overflow-hidden ring-2 ring-gray-100">
                  <Image src={modalUser.image || "/default-avatar.png"} alt="" fill className="object-cover" />
                </div>
                <div>
                  <div className="font-semibold text-gray-900">{modalUser.profile?.fullName || modalUser.name}</div>
                  <div className="text-xs text-gray-500">{modalUser.email}</div>
                </div>
              </div>

              <form onSubmit={handleAssign} className="space-y-4">
                <input type="hidden" name="userId" value={modalUser.id} />

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Admin Role <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="role"
                    value={selectedRole}
                    onChange={(e) => {
                      setSelectedRole(e.target.value as AdminRole);
                      setSelectedSubCounty("");
                      setSelectedWard("");
                      setSelectedStation("");
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 outline-none"
                  >
                    {creatableRoles.map((r) => (
                      <option key={r} value={r}>{ROLE_LABELS[r]}</option>
                    ))}
                  </select>
                </div>

                {["county_admin", "subcounty_admin", "ward_admin", "pollingstation_admin"].includes(selectedRole) && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      County <span className="text-red-500">*</span>
                    </label>
                    {managerRole !== "super_admin" ? (
                      <input
                        name="adminCounty"
                        value={managerScope.adminCounty ?? ""}
                        readOnly
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-sm text-gray-600"
                      />
                    ) : (
                      <select
                        name="adminCounty"
                        value={selectedCounty}
                        onChange={(e) => { setSelectedCounty(e.target.value); setSelectedSubCounty(""); setSelectedWard(""); setSelectedStation(""); }}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 outline-none"
                      >
                        <option value="">Select county</option>
                        {counties.map((c) => <option key={c} value={c}>{c}</option>)}
                      </select>
                    )}
                  </div>
                )}

                {["subcounty_admin", "ward_admin", "pollingstation_admin"].includes(selectedRole) && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Sub-County <span className="text-red-500">*</span>
                    </label>
                    {managerRole === "subcounty_admin" || managerRole === "ward_admin" ? (
                      <input
                        name="adminSubCounty"
                        value={managerScope.adminSubCounty ?? ""}
                        readOnly
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-sm text-gray-600"
                      />
                    ) : (
                      <select
                        name="adminSubCounty"
                        value={selectedSubCounty}
                        onChange={(e) => { setSelectedSubCounty(e.target.value); setSelectedWard(""); setSelectedStation(""); }}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 outline-none"
                      >
                        <option value="">Select sub-county</option>
                        {filteredSubCounties.map((s) => (
                          <option key={s.subCounty} value={s.subCounty}>{s.subCounty}</option>
                        ))}
                      </select>
                    )}
                  </div>
                )}

                {["ward_admin", "pollingstation_admin"].includes(selectedRole) && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Ward <span className="text-red-500">*</span>
                    </label>
                    {managerRole === "ward_admin" ? (
                      <input
                        name="adminWard"
                        value={managerScope.adminWard ?? ""}
                        readOnly
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-sm text-gray-600"
                      />
                    ) : (
                      <select
                        name="adminWard"
                        value={selectedWard}
                        onChange={(e) => { setSelectedWard(e.target.value); setSelectedStation(""); }}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 outline-none"
                      >
                        <option value="">Select ward</option>
                        {filteredWards.map((w) => (
                          <option key={w.ward} value={w.ward}>{w.ward}</option>
                        ))}
                      </select>
                    )}
                  </div>
                )}

                {selectedRole === "pollingstation_admin" && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Polling Station <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="pollingStationId"
                      value={selectedStation}
                      onChange={(e) => setSelectedStation(e.target.value)}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 outline-none"
                    >
                      <option value="">Select polling station</option>
                      {filteredStations.map((s) => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
                  </div>
                )}

                {roleMessage && (
                  <div className={`p-3 rounded-lg text-sm ${roleMessage.type === "success" ? "bg-green-50 text-green-800" : "bg-red-50 text-red-800"}`}>
                    {roleMessage.text}
                  </div>
                )}

                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={closeRoleModal} className="flex-1 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50">
                    Cancel
                  </button>
                  <button type="submit" disabled={isPending} className="flex-1 py-2 bg-purple-600 text-white rounded-lg text-sm font-semibold hover:bg-purple-700 disabled:opacity-50 transition-colors">
                    {isPending ? "Assigning..." : "Assign Role"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ── Permissions Modal ─────────────────────────────────────────────────── */}
      {permUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl">
            <div className="p-6">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-lg font-bold text-gray-900">Dashboard Access</h2>
                <button onClick={closePermModal} className="text-gray-400 hover:text-gray-700 text-2xl leading-none">&times;</button>
              </div>

              <div className="flex items-center gap-3 mb-5 p-3 bg-gray-50 rounded-lg">
                <div className="h-10 w-10 relative rounded-full overflow-hidden ring-2 ring-gray-100">
                  <Image src={permUser.image || "/default-avatar.png"} alt="" fill className="object-cover" />
                </div>
                <div>
                  <div className="font-semibold text-gray-900">{permUser.profile?.fullName || permUser.name}</div>
                  <div className="text-xs text-gray-500">{permUser.email}</div>
                </div>
              </div>

              <p className="text-xs text-gray-500 mb-3">
                <span className="font-medium text-gray-700">Voters</span> is always visible to all users.
                Select which additional sections this user can access.
              </p>

              <div className="space-y-2 mb-5">
                {ASSIGNABLE_SECTIONS.map((section) => (
                  <label key={section} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedPerms.includes(section)}
                      onChange={() => togglePerm(section)}
                      className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-800 font-medium">{SECTION_LABELS[section]}</span>
                  </label>
                ))}
              </div>

              {permMessage && (
                <div className={`p-3 rounded-lg text-sm mb-4 ${permMessage.type === "success" ? "bg-green-50 text-green-800" : "bg-red-50 text-red-800"}`}>
                  {permMessage.text}
                </div>
              )}

              <div className="flex gap-3">
                <button type="button" onClick={closePermModal} className="flex-1 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50">
                  Cancel
                </button>
                <button
                  onClick={handlePermSave}
                  disabled={isPending}
                  className="flex-1 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 transition-colors"
                >
                  {isPending ? "Saving..." : "Save Access"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
