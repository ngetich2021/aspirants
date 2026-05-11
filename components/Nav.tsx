"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { hasAccess, type AdminRole, type Section } from "@/lib/rbac";

const ADMIN_ROLES: AdminRole[] = [
  "super_admin",
  "county_admin",
  "subcounty_admin",
  "ward_admin",
];

const NAV_LINKS: { href: string; label: string; section: Section }[] = [
  { href: "/dashboard", label: "Messages", section: "messages" },
  { href: "/dashboard/aspirants", label: "Voters", section: "voters" },
  { href: "/dashboard/pollingStations", label: "Polling Stations", section: "pollingStations" },
  { href: "/dashboard/donations", label: "Donations", section: "donations" },
  { href: "/dashboard/team", label: "Team", section: "team" },
  { href: "/dashboard/activities", label: "Activities", section: "activities" },
  { href: "/dashboard/expenses", label: "Expenses", section: "expenses" },
];

export default function Nav() {
  const { data: session } = useSession();
  const adminRole = (session?.user?.adminRole || "user") as AdminRole;
  const permissions = session?.user?.permissions ?? null;
  const canManageAdmins = ADMIN_ROLES.includes(adminRole);

  return (
    <div className="flex flex-wrap justify-between gap-3 px-4 py-3 text-sm md:text-base bg-green-600 text-white shadow">
      {NAV_LINKS.map(({ href, label, section }) =>
        hasAccess(section, adminRole, permissions) ? (
          <Link key={href} href={href} className="hover:underline">
            {label}
          </Link>
        ) : null
      )}
      {canManageAdmins && (
        <Link
          href="/dashboard/admin"
          className="hover:underline font-semibold bg-white/20 px-2 rounded"
        >
          Admin
        </Link>
      )}
    </div>
  );
}
