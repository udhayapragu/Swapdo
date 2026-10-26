import { NextResponse, type NextRequest } from "next/server";

const PROTECTED = ["/dashboard", "/seller", "/admin", "/checkout"];

/**
 * Fast edge gate: unauthenticated visitors to private areas are redirected to
 * sign-in. This only checks for the cookie — real authorization (session
 * validity, roles, ownership) is enforced server-side on every page and API.
 */
export function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;
  if (PROTECTED.some((p) => pathname === p || pathname.startsWith(p + "/")) && !req.cookies.get("swapdo_session")) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.search = `?next=${encodeURIComponent(pathname + search)}`;
    return NextResponse.redirect(url);
  }
  const res = NextResponse.next();
  if (PROTECTED.some((p) => pathname.startsWith(p))) res.headers.set("X-Robots-Tag", "noindex, nofollow");
  return res;
}

export const config = { matcher: ["/dashboard/:path*", "/seller/:path*", "/admin/:path*", "/checkout/:path*"] };
