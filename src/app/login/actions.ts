"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { createSupabaseServerClient } from "@/lib/supabase";

export type LoginState = { error: string | null };

// Deliberately vague: saying "no account with that address" tells a stranger which
// CCF addresses exist.
const REJECTED = "That email and password combination did not work.";

export async function signIn(
  _previous: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { error: "Enter your email and password." };
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error || !data.user) {
    return { error: REJECTED };
  }

  // A valid Supabase login is not access on its own — an admin has to have added
  // the person as staff first. Sign them straight back out if not.
  const staff = await prisma.user.findFirst({
    where: { OR: [{ authId: data.user.id }, { email }] },
  });

  if (!staff) {
    await supabase.auth.signOut();
    return {
      error:
        "That account is not set up for this dashboard. Ask an administrator to add you.",
    };
  }

  redirect("/");
}

export async function signOutAction() {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect("/login");
}
