import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { hasAccess, type AdminRole, type Section } from "@/lib/rbac";

export async function requireSignedIn() {
  const session = await auth();
  if (!session?.user) redirect("/");
  return session;
}

// Require a specific designation-based role (e.g. "chairperson", "leader")
export async function requireRole(role: string) {
  const session = await auth();
  if (!session?.user || session.user.role !== role) redirect("/");
  return session;
}

// Require any recognized admin role in the hierarchy
export async function requireAdmin() {
  const session = await auth();
  const adminRoles: AdminRole[] = [
    "super_admin",
    "county_admin",
    "subcounty_admin",
    "ward_admin",
    "pollingstation_admin",
  ];
  if (!session?.user || !adminRoles.includes(session.user.adminRole as AdminRole)) {
    redirect("/");
  }
  return session;
}

export async function requireSection(section: Section) {
  const session = await auth();
  if (!session?.user?.id) redirect("/");
  const ok = hasAccess(section, session.user.adminRole ?? "user", session.user.permissions ?? null);
  if (!ok) redirect("/dashboard/aspirants");
  return session;
}

export async function requireSuperAdmin() {
  const session = await auth();
  if (!session?.user || session.user.adminRole !== "super_admin") redirect("/");
  return session;
}

// Returns the current session's RBAC scope
export async function getAdminScope() {
  const session = await auth();
  if (!session?.user) return null;

  return {
    adminRole: (session.user.adminRole || "user") as AdminRole,
    adminCounty: session.user.adminCounty ?? null,
    adminSubCounty: session.user.adminSubCounty ?? null,
    adminWard: session.user.adminWard ?? null,
    pollingStationId: session.user.pollingStationId ?? null,
  };
}
