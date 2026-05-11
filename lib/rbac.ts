// ── Dashboard sections ────────────────────────────────────────────────────────

export const SECTIONS = [
  "messages",
  "voters",
  "pollingStations",
  "donations",
  "team",
  "activities",
  "expenses",
] as const;

export type Section = (typeof SECTIONS)[number];

export const SECTION_LABELS: Record<Section, string> = {
  messages: "Messages",
  voters: "Voters",
  pollingStations: "Polling Stations",
  donations: "Donations",
  team: "Team",
  activities: "Activities",
  expenses: "Expenses",
};

// voters is always accessible to every signed-in user
const OPEN_SECTIONS: Section[] = ["voters"];

/**
 * Returns true if a user may access the given section.
 * - Any admin role bypasses the check entirely.
 * - Regular users must have the section in their permissions array.
 * - null permissions = voters only (default).
 */
export function hasAccess(
  section: Section,
  adminRole: string,
  permissions: string[] | null
): boolean {
  if ((ADMIN_ROLES as readonly string[]).includes(adminRole)) return true;
  if (OPEN_SECTIONS.includes(section)) return true;
  if (!permissions) return false;
  return permissions.includes(section);
}

// ── Admin roles ───────────────────────────────────────────────────────────────

export const ADMIN_ROLES = [
  "super_admin",
  "county_admin",
  "subcounty_admin",
  "ward_admin",
  "pollingstation_admin",
] as const;

export type AdminRole = (typeof ADMIN_ROLES)[number] | "user";

export const ROLE_LABELS: Record<string, string> = {
  super_admin: "Super Admin",
  county_admin: "County Admin",
  subcounty_admin: "Sub-County Admin",
  ward_admin: "Ward Admin",
  pollingstation_admin: "Polling Station Admin",
  user: "User",
};

export const ROLE_COLORS: Record<string, string> = {
  super_admin: "bg-red-100 text-red-800",
  county_admin: "bg-purple-100 text-purple-800",
  subcounty_admin: "bg-blue-100 text-blue-800",
  ward_admin: "bg-green-100 text-green-800",
  pollingstation_admin: "bg-yellow-100 text-yellow-800",
  user: "bg-gray-100 text-gray-600",
};

export function isAdmin(role: string): boolean {
  return ADMIN_ROLES.includes(role as (typeof ADMIN_ROLES)[number]);
}

export function isSuperAdmin(role: string): boolean {
  return role === "super_admin";
}

// Which roles can a given manager role create
export function getCreatableRoles(managerRole: AdminRole): AdminRole[] {
  switch (managerRole) {
    case "super_admin":
      return ["county_admin", "subcounty_admin", "ward_admin", "pollingstation_admin"];
    case "county_admin":
      return ["subcounty_admin", "ward_admin", "pollingstation_admin"];
    case "subcounty_admin":
      return ["ward_admin", "pollingstation_admin"];
    case "ward_admin":
      return ["pollingstation_admin"];
    default:
      return [];
  }
}

export function canCreateRole(managerRole: AdminRole, targetRole: AdminRole): boolean {
  return getCreatableRoles(managerRole).includes(targetRole);
}

export type Scope = {
  adminCounty?: string | null;
  adminSubCounty?: string | null;
  adminWard?: string | null;
  pollingStationId?: string | null;
};

// Returns a Prisma `where` clause for PollingStation based on admin scope
export function getPollingStationWhere(role: AdminRole, scope: Scope) {
  switch (role) {
    case "super_admin":
      return {};
    case "county_admin":
      return { county: scope.adminCounty ?? "" };
    case "subcounty_admin":
      return { county: scope.adminCounty ?? "", subCounty: scope.adminSubCounty ?? "" };
    case "ward_admin":
      return {
        county: scope.adminCounty ?? "",
        subCounty: scope.adminSubCounty ?? "",
        ward: scope.adminWard ?? "",
      };
    case "pollingstation_admin":
      return { id: scope.pollingStationId ?? "__none__" };
    default:
      return { id: "__none__" };
  }
}

export function validateScopeForRole(role: AdminRole, scope: Scope): boolean {
  switch (role) {
    case "super_admin":
    case "user":
      return true;
    case "county_admin":
      return !!scope.adminCounty;
    case "subcounty_admin":
      return !!scope.adminCounty && !!scope.adminSubCounty;
    case "ward_admin":
      return !!scope.adminCounty && !!scope.adminSubCounty && !!scope.adminWard;
    case "pollingstation_admin":
      return !!scope.pollingStationId;
    default:
      return false;
  }
}

// Checks that a target scope is within the manager's scope
export function scopeIsWithin(
  managerRole: AdminRole,
  managerScope: Scope,
  targetScope: Scope
): boolean {
  if (managerRole === "super_admin") return true;
  if (managerScope.adminCounty && targetScope.adminCounty !== managerScope.adminCounty)
    return false;
  if (
    managerRole !== "county_admin" &&
    managerScope.adminSubCounty &&
    targetScope.adminSubCounty !== managerScope.adminSubCounty
  )
    return false;
  if (
    managerRole === "ward_admin" &&
    managerScope.adminWard &&
    targetScope.adminWard !== managerScope.adminWard
  )
    return false;
  return true;
}

export function scopeLabel(role: AdminRole, scope: Scope): string {
  switch (role) {
    case "county_admin":
      return scope.adminCounty ?? "—";
    case "subcounty_admin":
      return `${scope.adminCounty} › ${scope.adminSubCounty}`;
    case "ward_admin":
      return `${scope.adminCounty} › ${scope.adminSubCounty} › ${scope.adminWard}`;
    case "pollingstation_admin":
      return `Station: ${scope.pollingStationId}`;
    default:
      return "—";
  }
}
