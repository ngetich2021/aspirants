"use server";

import { auth } from "@/auth";
import type { Session } from "next-auth";
import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import {
  type AdminRole,
  canCreateRole,
  validateScopeForRole,
  scopeIsWithin,
  type Scope,
} from "@/lib/rbac";

type ActionResult = { success: true } | { success: false; error: string };

async function getSession() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  const adminRole = (session.user.adminRole || "user") as AdminRole;
  if (!["super_admin", "county_admin", "subcounty_admin", "ward_admin"].includes(adminRole)) {
    throw new Error("Insufficient permissions — admin access required");
  }
  return { session, adminRole };
}

export async function getAdminPageData() {
  const { session, adminRole } = await getSession();

  const managerScope: Scope = {
    adminCounty: session.user.adminCounty,
    adminSubCounty: session.user.adminSubCounty,
    adminWard: session.user.adminWard,
    pollingStationId: session.user.pollingStationId,
  };

  // Scope filter for polling stations the manager can see
  const stationWhere =
    adminRole === "super_admin"
      ? {}
      : adminRole === "county_admin"
      ? { county: managerScope.adminCounty ?? "" }
      : adminRole === "subcounty_admin"
      ? { county: managerScope.adminCounty ?? "", subCounty: managerScope.adminSubCounty ?? "" }
      : { county: managerScope.adminCounty ?? "", subCounty: managerScope.adminSubCounty ?? "", ward: managerScope.adminWard ?? "" };

  const [users, counties, subCounties, wards, stations] = await Promise.all([
    prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        profile: {
          select: {
            role: true,
            adminRole: true,
            fullName: true,
            adminCounty: true,
            adminSubCounty: true,
            adminWard: true,
            pollingStationId: true,
            permissions: true,
            pollingStation: { select: { name: true } },
          },
        },
      },
      orderBy: { email: "asc" },
    }),

    prisma.pollingStation.findMany({
      where: stationWhere,
      select: { county: true },
      distinct: ["county"],
      orderBy: { county: "asc" },
    }),

    prisma.pollingStation.findMany({
      where: stationWhere,
      select: { county: true, subCounty: true },
      distinct: ["county", "subCounty"],
      orderBy: { subCounty: "asc" },
    }),

    prisma.pollingStation.findMany({
      where: stationWhere,
      select: { county: true, subCounty: true, ward: true },
      distinct: ["county", "subCounty", "ward"],
      orderBy: { ward: "asc" },
    }),

    prisma.pollingStation.findMany({
      where: stationWhere,
      select: { id: true, name: true, county: true, subCounty: true, ward: true },
      orderBy: { name: "asc" },
    }),
  ]);

  return {
    users,
    managerRole: adminRole,
    managerScope: {
      adminCounty: managerScope.adminCounty ?? null,
      adminSubCounty: managerScope.adminSubCounty ?? null,
      adminWard: managerScope.adminWard ?? null,
      pollingStationId: managerScope.pollingStationId ?? null,
    },
    counties: counties.map((c) => c.county),
    subCounties,
    wards,
    stations,
  };
}

export async function assignAdminRoleAction(formData: FormData): Promise<ActionResult> {
  let adminRole: AdminRole;
  let session: Session;

  try {
    const result = await getSession();
    adminRole = result.adminRole;
    session = result.session;
  } catch (err) {
    return { success: false, error: (err as Error).message };
  }

  const targetUserId = (formData.get("userId") as string)?.trim();
  const targetRole = (formData.get("role") as string)?.trim() as AdminRole;
  const adminCounty = (formData.get("adminCounty") as string)?.trim() || null;
  const adminSubCounty = (formData.get("adminSubCounty") as string)?.trim() || null;
  const adminWard = (formData.get("adminWard") as string)?.trim() || null;
  const pollingStationId = (formData.get("pollingStationId") as string)?.trim() || null;

  if (!targetUserId || !targetRole) {
    return { success: false, error: "User and role are required" };
  }

  if (!canCreateRole(adminRole, targetRole)) {
    return { success: false, error: `You cannot assign the "${targetRole}" role` };
  }

  const targetScope: Scope = { adminCounty, adminSubCounty, adminWard, pollingStationId };

  if (!validateScopeForRole(targetRole, targetScope)) {
    return { success: false, error: "Please fill in all required scope fields for this role" };
  }

  const managerScope: Scope = {
    adminCounty: session?.user?.adminCounty,
    adminSubCounty: session?.user?.adminSubCounty,
    adminWard: session?.user?.adminWard,
    pollingStationId: session?.user?.pollingStationId,
  };

  if (!scopeIsWithin(adminRole, managerScope, targetScope)) {
    return { success: false, error: "You cannot assign admins outside your own geographic scope" };
  }

  try {
    await prisma.profile.upsert({
      where: { userId: targetUserId },
      update: {
        adminRole: targetRole,
        adminCounty,
        adminSubCounty,
        adminWard,
        ...(targetRole === "pollingstation_admin" ? { pollingStationId } : { pollingStationId: null }),
      },
      create: {
        userId: targetUserId,
        adminRole: targetRole,
        adminCounty,
        adminSubCounty,
        adminWard,
        pollingStationId: targetRole === "pollingstation_admin" ? pollingStationId : null,
        role: "user",
      },
    });

    revalidatePath("/dashboard/admin");
    return { success: true };
  } catch (err) {
    console.error("Assign admin role failed:", err);
    return { success: false, error: "Failed to assign role. Please try again." };
  }
}

export async function removeAdminRoleAction(targetUserId: string): Promise<ActionResult> {
  try {
    await getSession();
  } catch (err) {
    return { success: false, error: (err as Error).message };
  }

  try {
    await prisma.profile.update({
      where: { userId: targetUserId },
      data: {
        adminRole: "user",
        adminCounty: null,
        adminSubCounty: null,
        adminWard: null,
      },
    });

    revalidatePath("/dashboard/admin");
    return { success: true };
  } catch (err) {
    console.error("Remove admin role failed:", err);
    return { success: false, error: "Failed to remove role." };
  }
}

export async function updatePermissionsAction(
  targetUserId: string,
  sections: string[]
): Promise<ActionResult> {
  try {
    await getSession();
  } catch (err) {
    return { success: false, error: (err as Error).message };
  }

  try {
    await prisma.profile.upsert({
      where: { userId: targetUserId },
      update: { permissions: JSON.stringify(sections) },
      create: { userId: targetUserId, role: "user", adminRole: "user", permissions: JSON.stringify(sections) },
    });
    revalidatePath("/dashboard/admin");
    return { success: true };
  } catch (err) {
    console.error("Update permissions failed:", err);
    return { success: false, error: "Failed to update permissions." };
  }
}
