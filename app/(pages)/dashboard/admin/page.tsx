import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getAdminPageData } from "./_components/actions";
import AdminClient from "./_components/AdminClient";
import type { AdminRole } from "@/lib/rbac";

export const revalidate = 10;

const ALLOWED_ROLES: AdminRole[] = [
  "super_admin",
  "county_admin",
  "subcounty_admin",
  "ward_admin",
];

export default async function AdminPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/");

  const adminRole = (session.user.adminRole || "user") as AdminRole;
  if (!ALLOWED_ROLES.includes(adminRole)) redirect("/dashboard");

  const data = await getAdminPageData();

  return (
    <AdminClient
      users={data.users}
      managerRole={data.managerRole}
      managerScope={data.managerScope}
      counties={data.counties}
      subCounties={data.subCounties}
      wards={data.wards}
      stations={data.stations}
    />
  );
}
