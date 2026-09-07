import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Next 16 calls this Proxy; it was Middleware in earlier versions.
//
// Two jobs, both cheap:
//   1. Refresh an expiring Supabase session, which Server Components cannot do
//      because they are not allowed to set cookies.
//   2. Bounce signed-out visitors to /login before a page renders.
//
// This is NOT the security boundary. It only sees a cookie, and a cookie can be
// stale or forged. Every page and Server Action independently resolves the user
// through src/lib/session.ts, which revalidates the token with Supabase and checks
// the staff record. Removing this file would cost a redirect, not access control.

const PUBLIC_PATHS = ["/login"];

function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`),
  );
}

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // Misconfiguration must not mean open access. Without these values no session
  // can be read, so nobody can be signed in — send everything to /login rather
  // than letting requests past. A forgotten environment variable on a new
  // deployment would otherwise publish the whole dashboard.
  if (!url || !key) {
    if (isPublicPath(request.nextUrl.pathname)) return response;
    const login = request.nextUrl.clone();
    login.pathname = "/login";
    return NextResponse.redirect(login);
  }

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (cookiesToSet) => {
        for (const { name, value } of cookiesToSet) {
          request.cookies.set(name, value);
        }
        response = NextResponse.next({ request });
        for (const { name, value, options } of cookiesToSet) {
          response.cookies.set(name, value, options);
        }
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user && !isPublicPath(request.nextUrl.pathname)) {
    const login = request.nextUrl.clone();
    login.pathname = "/login";
    return NextResponse.redirect(login);
  }

  return response;
}

export const config = {
  // Skip Next's own assets and image requests; they never need a session.
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
