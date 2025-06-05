// File: middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export const config = {
  matcher: ["/projects/:path*", "/dashboard/:path*"],
};

export function middleware(req: NextRequest) {
  // 1) Extract auth_token cookie
  const token = req.cookies.get("auth_token")?.value;

  // 2) If no token, redirect to "/" (or /login). Otherwise allow.
  if (!token) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  // 3) If token exists, just continue to the requested route.
  return NextResponse.next();
}