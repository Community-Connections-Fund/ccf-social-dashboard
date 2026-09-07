import Link from "next/link";
import { AlumnusForm } from "@/components/alumnus-form";
import { getCurrentUser } from "@/lib/session";
import { canViewContactInfo, type Role } from "@/lib/workflow";
import { createAlumnus } from "../actions";

// This page reads live data. Without this, Next prerenders it at build time and
// the numbers never change again.
export const dynamic = "force-dynamic";

export default async function NewAlumnusPage() {
  const user = await getCurrentUser();

  return (
    <div className="mx-auto max-w-3xl">
      <Link
        href="/alumni"
        className="text-sm text-slate-500 hover:text-slate-900"
      >
        ← Alumni
      </Link>
      <h1 className="mt-2 text-2xl font-semibold text-slate-900">Add alum</h1>

      <div className="mt-6">
        <AlumnusForm
          action={createAlumnus}
          showContact={canViewContactInfo(user.role as Role)}
          submitLabel="Add alum"
          cancelHref="/alumni"
          values={{
            firstName: "",
            lastName: null,
            cohortYear: null,
            currentOrganization: null,
            currentRole: null,
            boardMemberships: null,
            linkedin: null,
            personalEmail: null,
            workEmail: null,
            careerUpdates: null,
            awards: null,
            storyCollected: false,
            featuredStatus: "NOT_FEATURED",
          }}
        />
      </div>
    </div>
  );
}
