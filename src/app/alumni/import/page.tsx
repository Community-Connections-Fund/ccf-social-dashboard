import Link from "next/link";
import { getCurrentUser } from "@/lib/session";
import { canImportAlumni, type Role } from "@/lib/workflow";
import { ImportForm } from "./import-form";

// This page reads live data. Without this, Next prerenders it at build time and
// the numbers never change again.
export const dynamic = "force-dynamic";

export default async function AlumniImportPage() {
  const user = await getCurrentUser();

  if (!canImportAlumni(user.role as Role)) {
    return (
      <div className="mx-auto max-w-3xl">
        <h1 className="text-2xl font-semibold text-slate-900">Import alumni</h1>
        <p className="mt-4 rounded-lg border border-slate-200 bg-white px-4 py-6 text-sm text-slate-600">
          Your role cannot import alumni records.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl">
      <header>
        <Link
          href="/alumni"
          className="text-sm text-slate-500 hover:text-slate-900"
        >
          ← Alumni
        </Link>
        <h1 className="mt-2 text-2xl font-semibold text-slate-900">
          Import alumni
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          Export your archive sheet as CSV and upload it here. You will see
          exactly what changes before anything is saved.
        </p>
      </header>

      <section className="mt-6 rounded-lg border border-slate-200 bg-white p-4 text-sm text-slate-600">
        <h2 className="font-medium text-slate-900">What gets read</h2>
        <p className="mt-2">
          First name and Last name (or a single Name column, which gets split),
          Organization, Cohort year, Board memberships, LinkedIn, Personal
          email, Work email. A Role or Title column is picked up too if you add
          one.
        </p>
        <p className="mt-2">
          Re-running an import updates people it already knows and adds the rest.
          It never overwrites a field your sheet leaves blank, and never touches
          spotlight status, story collected, career updates, or awards — those
          belong to the dashboard, not the sheet.
        </p>
      </section>

      <ImportForm />
    </div>
  );
}
