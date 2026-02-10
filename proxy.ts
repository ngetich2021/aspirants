// middleware.ts
import { auth } from "@/auth";
import { NextResponse } from "next/server";

const protectedRoutes = [
  "/admin",
  "/admin/:path*",
  "/dashboard",
  "/dashboard/:path*",
  "/hospital",
  "/hospital/:path*",
  "/pharmacy",
  "/pharmacy/:path*",
  "/reports",
  "/reports/:path*",
  "/staff",
  "/staff/:path*",
   "/suppliers",
  "/suppliers/:path*",
   "/payments",
  "/payments/:path*",
    "/labs",
  "/labs/:path*",
   "/patients",
  "/patients/:path*",
   "/expenses",
  "/expenses/:path*",
  "/booking",
  "/booking/:path*",
  "/assets",
  "/assets/:path*",
];

export default auth((req) => {
  const { nextUrl } = req;
  const session = req.auth;

  // Helper: check if current path matches any protected route (exact or prefix)
  const isProtected = protectedRoutes.some((route) => {
    const base = route.replace("/:path*", "");
    return nextUrl.pathname === base || nextUrl.pathname.startsWith(`${base}/`);
  });

  if (!isProtected) {
    return NextResponse.next();
  }

  // Case 1: Not authenticated → redirect to login/home with optional "from" tracking
  if (!session?.user) {
    const loginUrl = new URL("/", nextUrl); // or "/login" if you move it
    loginUrl.searchParams.set("from", nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Case 2: Authenticated but no admin role → FORCE sign-out
  if (session.user.role !== "admin") {
    const signOutUrl = new URL("/api/auth/signout", nextUrl.origin);

    // After sign-out, try the original protected path again (user will need to pick correct account)
    signOutUrl.searchParams.set("callbackUrl", nextUrl.pathname + nextUrl.search);

    // Optional: add hint param for UI message on home page
    // signOutUrl.searchParams.set("reason", "no-access");

    return NextResponse.redirect(signOutUrl);
  }

  // Case 3: Good to go
  return NextResponse.next();
});

export const config = {
  matcher: [
    "/admin/:path*",
    "/dashboard/:path*",
    "/hospital/:path*",
    "/pharmacy/:path*",
    "/reports/:path*",
    "/staff/:path*",
    "/suppliers/:path*",
    "/payments/:path*",
    "/labs/:path*",
    "/patients/:path*",
    "/expenses/:path*",
    "/booking/:path*",
    "/assets/:path*",
  ],
};