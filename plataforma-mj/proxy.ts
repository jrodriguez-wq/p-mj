import { NextResponse, type NextRequest } from "next/server";

const COOKIE_TOKEN = "sb-access-token";
const PUBLIC_PATHS = ["/login", "/reset-password"];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(COOKIE_TOKEN)?.value;

  const isPublicPath = PUBLIC_PATHS.some((p) => pathname.startsWith(p));
  const isDashboardPath = pathname.startsWith("/dashboard");

  // Redirect unauthenticated users away from protected routes
  if (isDashboardPath && !token) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Redirect authenticated users away from login
  if (isPublicPath && token) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next({ request });
}

export const config = {
  matcher: ["/dashboard/:path*", "/login", "/reset-password"],
};
