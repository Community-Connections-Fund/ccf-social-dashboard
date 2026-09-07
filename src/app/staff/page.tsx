import {
  Field,
  buttonClass,
  inputClass,
  secondaryButtonClass,
} from "@/components/ui";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { ROLES, ROLE_LABELS, type Role } from "@/lib/workflow";
import { addStaff, removeStaff, updateStaffRole } from "./actions";

export const dynamic = "force-dynamic";

const ROLE_NOTES: Record<Role, string> = {
  ADMIN: "Everything, including managing staff and deleting records.",
  EDITOR: "Write and edit content. Can see alumni contact details.",
  REVIEWER: "Approve posts. Cannot see alumni contact details.",
  VIEWER: "Read only. Cannot see alumni contact details.",
};

export default async function StaffPage() {
  const currentUser = await getCurrentUser();

  if ((currentUser.role as Role) !== "ADMIN") {
    return (
      <div className="mx-auto max-w-3xl">
        <h1 className="text-2xl font-semibold text-slate-900">Staff</h1>
        <p className="mt-4 rounded-lg border border-slate-200 bg-white px-4 py-6 text-sm text-slate-600">
          Only an administrator can manage staff access.
        </p>
      </div>
    );
  }

  const staff = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      authId: true,
      createdAt: true,
    },
    orderBy: { createdAt: "asc" },
  });

  return (
    <div className="mx-auto max-w-4xl">
      <header>
        <h1 className="text-2xl font-semibold text-slate-900">Staff access</h1>
        <p className="mt-1 text-sm text-slate-600">
          Who can sign in, and what they are allowed to do.
        </p>
      </header>

      <section className="mt-6 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
        <p className="font-medium">Adding someone takes two steps</p>
        <p className="mt-1">
          Add them here, then create their login in Supabase under{" "}
          <strong>Authentication → Users → Add user</strong>, using the same email
          address. They are matched up the first time they sign in. Adding a row
          here on its own does not create a password.
        </p>
      </section>

      <section className="mt-6 rounded-lg border border-slate-200 bg-white p-4">
        <h2 className="text-sm font-medium text-slate-900">Add a staff member</h2>
        <form action={addStaff} className="mt-3 grid gap-3 sm:grid-cols-4">
          <Field label="Name" htmlFor="name">
            <input id="name" name="name" required className={inputClass} />
          </Field>
          <Field label="Email" htmlFor="email">
            <input
              id="email"
              name="email"
              type="email"
              required
              className={inputClass}
            />
          </Field>
          <Field label="Role" htmlFor="role">
            <select id="role" name="role" className={inputClass}>
              {ROLES.map((role) => (
                <option key={role} value={role}>
                  {ROLE_LABELS[role]}
                </option>
              ))}
            </select>
          </Field>
          <div className="flex items-end">
            <button type="submit" className={buttonClass}>
              Add
            </button>
          </div>
        </form>
      </section>

      <div className="mt-6 overflow-x-auto rounded-lg border border-slate-200 bg-white">
        <table className="min-w-full text-sm">
          <thead className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Email</th>
              <th className="px-4 py-3 font-medium">Signed in before</th>
              <th className="px-4 py-3 font-medium">Role</th>
              <th className="px-4 py-3 font-medium"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {staff.map((person) => (
              <tr key={person.id}>
                <td className="px-4 py-3 font-medium text-slate-900">
                  {person.name}
                  {person.id === currentUser.id ? (
                    <span className="ml-2 text-xs font-normal text-slate-400">
                      you
                    </span>
                  ) : null}
                </td>
                <td className="px-4 py-3 text-slate-600">{person.email}</td>
                <td className="px-4 py-3 text-slate-600">
                  {person.authId ? "Yes" : "Not yet"}
                </td>
                <td className="px-4 py-3">
                  <form action={updateStaffRole} className="flex gap-2">
                    <input type="hidden" name="userId" value={person.id} />
                    <select
                      name="role"
                      defaultValue={person.role}
                      className="rounded-md border border-slate-300 px-2 py-1 text-sm"
                    >
                      {ROLES.map((role) => (
                        <option key={role} value={role}>
                          {ROLE_LABELS[role]}
                        </option>
                      ))}
                    </select>
                    <button type="submit" className={secondaryButtonClass}>
                      Save
                    </button>
                  </form>
                </td>
                <td className="px-4 py-3 text-right">
                  {person.id === currentUser.id ? null : (
                    <form action={removeStaff}>
                      <input type="hidden" name="userId" value={person.id} />
                      <button
                        type="submit"
                        className="text-sm font-medium text-red-700 underline underline-offset-2 hover:text-red-800"
                      >
                        Remove
                      </button>
                    </form>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <section className="mt-6 rounded-lg border border-slate-200 bg-white p-4">
        <h2 className="text-sm font-medium text-slate-900">What the roles mean</h2>
        <dl className="mt-2 divide-y divide-slate-100 text-sm">
          {ROLES.map((role) => (
            <div key={role} className="flex gap-4 py-2">
              <dt className="w-24 shrink-0 font-medium text-slate-700">
                {ROLE_LABELS[role]}
              </dt>
              <dd className="text-slate-600">{ROLE_NOTES[role]}</dd>
            </div>
          ))}
        </dl>
      </section>
    </div>
  );
}
