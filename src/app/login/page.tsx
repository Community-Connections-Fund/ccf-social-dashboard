import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/session";
import { LoginForm } from "./login-form";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  // Already signed in — no reason to show the form again.
  if (await getSessionUser()) redirect("/");

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-sm flex-col justify-center">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-slate-900">
          Community Connections Fund
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          Sign in to the social media dashboard.
        </p>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-6">
        <LoginForm />
      </div>

      <p className="mt-4 text-xs text-slate-500">
        Accounts are created by an administrator. If you cannot get in, ask them
        to add your email address.
      </p>
    </div>
  );
}
