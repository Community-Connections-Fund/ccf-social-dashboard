import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

function requiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `${name} is missing from .env. Find it in Supabase under Project Settings -> API Keys.`,
    );
  }
  return value;
}

/**
 * Supabase client bound to the request's cookies, so it can read the signed-in
 * user and refresh an expiring session.
 */
/**
 * Hardening applied to every Supabase auth cookie.
 *
 * The library leaves these off by default because a browser-side Supabase client
 * needs to read the token. This app has no browser-side client — every Supabase
 * call happens on the server — so the token has no reason to be reachable from
 * JavaScript, and making it unreachable means an injected script cannot steal a
 * session.
 */
export const SESSION_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
};

export async function createSupabaseServerClient() {
  const cookieStore = await cookies();

  return createServerClient(
    requiredEnv("NEXT_PUBLIC_SUPABASE_URL"),
    requiredEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cookiesToSet) => {
          try {
            for (const { name, value, options } of cookiesToSet) {
              cookieStore.set(name, value, { ...options, ...SESSION_COOKIE_OPTIONS });
            }
          } catch {
            // Server Components cannot set cookies. Session refresh happens in
            // proxy.ts, which can, so ignoring this here is safe rather than
            // masking a real failure.
          }
        },
      },
    },
  );
}
