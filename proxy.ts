import { auth } from "@/auth";
import { NextResponse } from "next/server";

// Define strict access map
const ROLE_PERMISSIONS: Record<string, string[]> = {
  "/dashboard/activities": ["secretary", "sg", "chairperson", "leader"],
  "/dashboard/donations": ["treasurer", "chairperson", "leader"],
  "/dashboard/expenses": ["treasurer", "chairperson", "leader"],
  "/dashboard/pollingStations": ["sg", "chairperson", "leader"],
  "/dashboard/aspirants": ["chairperson", "leader"],
  "/dashboard/team": ["chairperson", "leader"],
  "/dashboard": ["secretary", "treasurer", "sg", "chairperson", "leader"],
};

// All valid administrative roles
const ALL_ALLOWED_ROLES = ["secretary", "treasurer", "sg", "chairperson", "leader"];

export default auth((req) => {
  const { nextUrl } = req;
  const session = req.auth;
  
  // Clean the role string (remove extra spaces like "leader ")
  const userRole = session?.user?.role?.toLowerCase().trim();

  const isDashboardRoute = nextUrl.pathname.startsWith("/dashboard");

  // Only run logic on dashboard routes
  if (!isDashboardRoute) return NextResponse.next();

  // 1. Not logged in -> Redirect to landing page
  if (!session?.user) {
    return NextResponse.redirect(new URL("/", nextUrl.origin));
  }

  // 2. STRICT CHECK: Is the user's role recognized at all?
  // If they have a "user" role or something not in your list, KILL the session.
  if (!userRole || !ALL_ALLOWED_ROLES.includes(userRole)) {
    const signOutUrl = new URL("/api/auth/signout", nextUrl.origin);
    // After signout, send them to home with an error message
    signOutUrl.searchParams.set("callbackUrl", "/?error=UnauthorizedRole");
    return NextResponse.redirect(signOutUrl);
  }

  // 3. SPECIFIC PATH CHECK: User has a valid role, but are they allowed HERE?
  // Example: A Treasurer trying to enter /dashboard/activities
  const matchingPath = Object.keys(ROLE_PERMISSIONS).find(path => 
    nextUrl.pathname === path || nextUrl.pathname.startsWith(`${path}/`)
  );

  const allowedRolesForPath = matchingPath ? ROLE_PERMISSIONS[matchingPath] : [];

  if (allowedRolesForPath.length > 0 && !allowedRolesForPath.includes(userRole)) {
    // They are a valid team member, but in the wrong section. 
    // Just bounce them back to the main dashboard instead of signing them out.
    return NextResponse.redirect(new URL("/dashboard?error=NoPermission", nextUrl.origin));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/dashboard/:path*"],
};