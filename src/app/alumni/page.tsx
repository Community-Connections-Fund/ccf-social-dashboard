import { prisma } from "@/lib/prisma";
import { FEATURED_STATUS_LABELS, type FeaturedStatus } from "@/lib/workflow";

export default async function AlumniPage() {
  const alumni = await prisma.alumnus.findMany({
    orderBy: [{ cohortYear: "desc" }, { name: "asc" }],
  });

  return (
    <div className="mx-auto max-w-5xl">
      <header>
        <h1 className="text-2xl font-semibold text-slate-900">
          Alumni Database
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          The long-term archive every spotlight post draws from.
        </p>
      </header>

      {alumni.length === 0 ? (
        <p className="mt-6 rounded-lg border border-dashed border-slate-300 bg-white px-4 py-6 text-sm text-slate-500">
          No alumni records yet.
        </p>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-lg border border-slate-200 bg-white">
          <table className="min-w-full text-sm">
            <thead className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Cohort</th>
                <th className="px-4 py-3 font-medium">Organization</th>
                <th className="px-4 py-3 font-medium">Role</th>
                <th className="px-4 py-3 font-medium">Story</th>
                <th className="px-4 py-3 font-medium">Spotlight</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {alumni.map((person) => (
                <tr key={person.id}>
                  <td className="px-4 py-3 font-medium text-slate-900">
                    {person.name}
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {person.cohortYear ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {person.currentOrganization ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {person.currentRole ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {person.storyCollected ? "Collected" : "Not collected"}
                  </td>
                  <td className="px-4 py-3 text-slate-600">
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
