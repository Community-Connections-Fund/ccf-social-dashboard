import Link from "next/link";
import {
  EmptyState,
  buttonClass,
  inputClass,
  secondaryButtonClass,
} from "@/components/ui";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import {
  FEATURED_STATUS_LABELS,
  canViewContactInfo,
  type FeaturedStatus,
  type Role,
} from "@/lib/workflow";

export default async function AlumniPage({
  searchParams,
}: PageProps<"/alumni">) {
  const params = await searchParams;
  const query = typeof params.q === "string" ? params.q.trim() : "";

  const user = await getCurrentUser();
  const showContact = canViewContactInfo(user.role as Role);

  // Email columns are only queried for roles allowed to see them, so they never
  // reach the page for anyone else.
  const alumni = await prisma.alumnus.findMany({
    // `mode: insensitive` matters on Postgres, where `contains` is case-sensitive
    // by default — without it, searching "google" would miss "Google".
    where: query
      ? {
          OR: [
            { firstName: { contains: query, mode: "insensitive" } },
            { lastName: { contains: query, mode: "insensitive" } },
            { currentOrganization: { contains: query, mode: "insensitive" } },
            { boardMemberships: { contains: query, mode: "insensitive" } },
          ],
        }
      : undefined,
    select: {
      id: true,
      firstName: true,
      lastName: true,
      cohortYear: true,
      currentOrganization: true,
      boardMemberships: true,
      linkedin: true,
      storyCollected: true,
      featuredStatus: true,
      personalEmail: showContact,
      workEmail: showContact,
    },
    orderBy: [{ cohortYear: "desc" }, { lastName: "asc" }, { firstName: "asc" }],
  });

  return (
    <div className="mx-auto max-w-7xl">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">
            Alumni Database
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            {alumni.length} record{alumni.length === 1 ? "" : "s"} — the archive
            every spotlight post draws from.
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/alumni/import" className={secondaryButtonClass}>
            Import CSV
          </Link>
          <Link href="/alumni/new" className={buttonClass}>
            Add alum
          </Link>
        </div>
      </header>

      <form className="mt-6 flex flex-wrap items-end gap-3">
        <div className="min-w-64 flex-1">
          <label
            htmlFor="q"
            className="block text-sm font-medium text-slate-700"
          >
            Search
          </label>
          <input
            id="q"
            name="q"
            defaultValue={query}
            className={inputClass}
            placeholder="Name, organization, or board"
          />
        </div>
        <button type="submit" className={secondaryButtonClass}>
          Search
        </button>
        {query ? (
          <Link
            href="/alumni"
            className="pb-2 text-sm text-slate-500 hover:text-slate-900"
          >
            Clear
          </Link>
        ) : null}
      </form>

      {alumni.length === 0 ? (
        <div className="mt-6">
          <EmptyState>
            {query
              ? "Nobody matches that search."
              : "No alumni yet. Import your archive or add someone."}
          </EmptyState>
        </div>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-lg border border-slate-200 bg-white">
          <table className="min-w-full text-sm">
            <thead className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-3 py-3 font-medium">First name</th>
                <th className="px-3 py-3 font-medium">Last name</th>
                <th className="px-3 py-3 font-medium">Cohort</th>
                <th className="px-3 py-3 font-medium">Organization</th>
                <th className="px-3 py-3 font-medium">Board memberships</th>
                <th className="px-3 py-3 font-medium">LinkedIn</th>
                {showContact ? (
                  <>
                    <th className="px-3 py-3 font-medium">Work email</th>
                    <th className="px-3 py-3 font-medium">Personal email</th>
                  </>
                ) : null}
                <th className="px-3 py-3 font-medium">Story</th>
                <th className="px-3 py-3 font-medium">Spotlight</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {alumni.map((person) => (
                <tr key={person.id} className="hover:bg-slate-50">
                  <td className="px-3 py-3 font-medium text-slate-900">
                    <Link
                      href={`/alumni/${person.id}`}
                      className="hover:underline"
                    >
                      {person.firstName}
                    </Link>
                  </td>
                  <td className="px-3 py-3 font-medium text-slate-900">
                    <Link
                      href={`/alumni/${person.id}`}
                      className="hover:underline"
                    >
                      {person.lastName ?? "—"}
                    </Link>
                  </td>
                  <td className="px-3 py-3 text-slate-600">
                    {person.cohortYear ?? "—"}
                  </td>
                  <td className="px-3 py-3 text-slate-600">
                    {person.currentOrganization ?? "—"}
                  </td>
                  <td className="px-3 py-3 text-slate-600">
                    {person.boardMemberships ?? "—"}
                  </td>
                  <td className="px-3 py-3 text-slate-600">
                    {person.linkedin ? (
                      <a
                        href={person.linkedin}
                        target="_blank"
                        rel="noreferrer"
                        className="underline underline-offset-2"
                      >
                        Profile
                      </a>
                    ) : (
                      "—"
                    )}
                  </td>
                  {showContact ? (
                    <>
                      <td className="px-3 py-3 text-slate-600">
                        {person.workEmail ?? "—"}
                      </td>
                      <td className="px-3 py-3 text-slate-600">
                        {person.personalEmail ?? "—"}
                      </td>
                    </>
                  ) : null}
                  <td className="px-3 py-3 text-slate-600">
                    {person.storyCollected ? "Collected" : "Not collected"}
                  </td>
                  <td className="px-3 py-3 text-slate-600">
                    {
                      FEATURED_STATUS_LABELS[
                        person.featuredStatus as FeaturedStatus
                      ]
                    }
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
