import { NextRequest, NextResponse } from "next/server";
import { verifySession, SESSION_COOKIE } from "./lib/auth";

// Endpoints the public website needs *without* a logged-in admin session.
// Everything else under /api and /admin is admin-only.
const PUBLIC_ROUTES: { path: string; methods: string[] }[] = [
  { path: "/api/emergencies", methods: ["POST"] }, // submit a new emergency
  { path: "/api/auth/login", methods: ["POST"] },
  { path: "/api/settings/public", methods: ["GET"] }, // control-room phone number
];

function isPublicRoute(pathname: string, method: string) {
  return PUBLIC_ROUTES.some((r) => r.path === pathname && r.methods.includes(method));
}

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const isAdminPage = pathname.startsWith("/admin") && pathname !== "/admin/login";
  const isApi = pathname.startsWith("/api/");

  if (!isAdminPage && !isApi) {
    return NextResponse.next();
  }

  if (isApi && isPublicRoute(pathname, req.method)) {
    return NextResponse.next();
  }

  const token = req.cookies.get(SESSION_COOKIE)?.value;
  const session = token ? verifySession(token) : null;

  if (!session) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const loginUrl = new URL("/admin/login", req.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/api/:path*"],
};
