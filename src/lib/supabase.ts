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
              cookieStore.set(name, value, options);
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
