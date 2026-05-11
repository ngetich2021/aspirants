import { auth } from "@/auth";
import { NextResponse } from "next/server";

const ADMIN_ROLES = new Set([
  "super_admin", "county_admin", "subcounty_admin", "ward_admin", "pollingstation_admin",
]);

export default auth((req) => {
  const { nextUrl } = req;
  const session = req.auth;

  if (!nextUrl.pathname.startsWith("/dashboard")) return NextResponse.next();

  if (!session?.user?.id) {
    return NextResponse.redirect(new URL("/", nextUrl.origin));
  }

  const adminRole = session.user.adminRole?.toLowerCase().trim() ?? "user";

  if (nextUrl.pathname.startsWith("/dashboard/admin")) {
    if (ADMIN_ROLES.has(adminRole)) return NextResponse.next();
    return NextResponse.redirect(new URL("/dashboard/aspirants", nextUrl.origin));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/dashboard/:path*"],
};
