"use client";

import { useActionState } from "react";
import { buttonClass, inputClass } from "@/components/ui";
import { signIn, type LoginState } from "./actions";

const INITIAL: LoginState = { error: null };

export function LoginForm() {
  const [state, action, pending] = useActionState(signIn, INITIAL);

  return (
    <form action={action} className="flex flex-col gap-4">
      <div>
        <label
          htmlFor="email"
          className="block text-sm font-medium text-slate-700"
        >
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="username"
          required
          className={inputClass}
        />
      </div>

      <div>
        <label
          htmlFor="password"
          className="block text-sm font-medium text-slate-700"
        >
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className={inputClass}
        />
      </div>

      {state.error ? (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-800">
          {state.error}
        </p>
      ) : null}

      <button type="submit" disabled={pending} className={buttonClass}>
        {pending ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
