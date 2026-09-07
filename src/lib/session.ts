import { redirect } from "next/navigation";
import { cache } from "react";
import { prisma } from "@/lib/prisma";
import { createSupabaseServerClient } from "@/lib/supabase";

export type SessionUser = {
  id: string;
  name: string;
  email: string;
  role: string;
};

/**
 * The single place that answers "who is making this request?".
 *
 * Passwords are Supabase's problem; roles are ours. A Supabase account on its own
 * grants nothing — the address must also match a staff record an admin created,
 * so there is no self-signup into CCF's data.
 *
 * Memoised per render so a page that asks several times costs one lookup.
 */
export const getSessionUser = cache(async (): Promise<SessionUser | null> => {
  const supabase = await createSupabaseServerClient();

  // getUser() revalidates the token with Supabase. getSession() would simply
  // trust whatever cookie the browser sent, which is forgeable.
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user?.email) return null;

  const email = user.email.toLowerCase();
  const staff = await prisma.user.findFirst({
    where: { OR: [{ authId: user.id }, { email }] },
  });

  // Authenticated with Supabase but not on staff: no access.
  if (!staff) return null;

  // The record is already claimed by a different Supabase account. Refuse rather
  // than reassign — that would let a new signup on a recycled address inherit
  // someone's role.
  if (staff.authId && staff.authId !== user.id) return null;

  if (!staff.authId) {
    await prisma.user.update({
      where: { id: staff.id },
      data: { authId: user.id },
    });
  }

  return {
    id: staff.id,
    name: staff.name,
    email: staff.email,
    role: staff.role,
  };
});

/**
 * Use in pages and Server Actions that require a signed-in staff member.
 * Every caller already treats the result as authoritative.
 */
export async function getCurrentUser(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  return user;
}

export async function signOut() {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
}
