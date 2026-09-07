import Link from "next/link";
import {
  EmptyState,
  buttonClass,
  inputClass,
  secondaryButtonClass,
} from "@/components/ui";
import { formatMedium } from "@/lib/dates";
import { prisma } from "@/lib/prisma";

export default async function ContentBankPage({
  searchParams,
}: PageProps<"/content-bank">) {
  const params = await searchParams;
  const query = typeof params.q === "string" ? params.q.trim() : "";
  const pillarId = typeof params.pillar === "string" ? params.pillar : "";

  const [entries, pillars] = await Promise.all([
    prisma.contentBankEntry.findMany({
      where: {
        AND: [
          pillarId ? { contentPillarId: pillarId } : {},
          query
            ? {
                OR: [
                  { idea: { contains: query } },
                  { captionDraft: { contains: query } },
                  { performanceNotes: { contains: query } },
                ],
              }
            : {},
        ],
      },
      include: { contentPillar: { select: { name: true } } },
      orderBy: { idea: "asc" },
    }),
    prisma.contentPillar.findMany({
      select: { id: true, name: true },
      orderBy: { sortOrder: "asc" },
    }),
  ]);

  return (
    <div className="mx-auto max-w-5xl">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Content Bank</h1>
          <p className="mt-1 text-sm text-slate-600">
            Approved copy you can reuse. Send any entry straight to the calendar
            as a draft.
          </p>
        </div>
        <Link href="/content-bank/new" className={buttonClass}>
          New entry
        </Link>
      </header>

      <form className="mt-6 flex flex-wrap items-end gap-3">
        <div className="min-w-56 flex-1">
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
            placeholder="Search ideas, captions, notes"
          />
        </div>
        <div className="min-w-48">
          <label
            htmlFor="pillar"
            className="block text-sm font-medium text-slate-700"
          >
            Pillar
          </label>
          <select
            id="pillar"
            name="pillar"
            defaultValue={pillarId}
            className={inputClass}
          >
            <option value="">All pillars</option>
            {pillars.map((pillar) => (
              <option key={pillar.id} value={pillar.id}>
                {pillar.name}
              </option>
            ))}
          </select>
        </div>
        <button type="submit" className={secondaryButtonClass}>
          Filter
        </button>
        {query || pillarId ? (
          <Link
            href="/content-bank"
            className="pb-2 text-sm text-slate-500 hover:text-slate-900"
          >
            Clear
          </Link>
        ) : null}
      </form>

      <p className="mt-4 text-sm text-slate-500">
        {entries.length} {entries.length === 1 ? "entry" : "entries"}
      </p>

      {entries.length === 0 ? (
        <div className="mt-2">
          <EmptyState>
            {query || pillarId
              ? "Nothing matches that search."
              : "No entries yet. Add the copy you reuse most often."}
          </EmptyState>
        </div>
      ) : (
        <ul className="mt-2 flex flex-col gap-3">
          {entries.map((entry) => (
            <li
              key={entry.id}
              className="rounded-lg border border-slate-200 bg-white p-4"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="font-medium text-slate-900">{entry.idea}</h2>
                  <p className="mt-0.5 text-sm text-slate-500">
                    {[
                      entry.contentPillar?.name,
                      entry.lastPosted
                        ? `Last posted ${formatMedium.format(entry.lastPosted)}`
                        : "Never posted",
                      entry.evergreen ? "Evergreen" : null,
                      entry.graphicNeeded ? "Needs graphic" : null,
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                </div>

                <div className="flex shrink-0 gap-2">
                  <Link
                    href={`/calendar/new?fromBank=${entry.id}`}
                    className={buttonClass}
                  >
                    Use in calendar
                  </Link>
                  <Link
                    href={`/content-bank/${entry.id}/edit`}
                    className={secondaryButtonClass}
                  >
                    Edit
                  </Link>
                </div>
              </div>

              {entry.captionDraft ? (
                <p className="mt-3 whitespace-pre-wrap border-l-2 border-slate-200 pl-3 text-sm text-slate-700">
                  {entry.captionDraft}
                </p>
              ) : (
                <p className="mt-3 text-sm italic text-slate-400">
                  No caption written yet.
                </p>
              )}

              {entry.performanceNotes ? (
                <p className="mt-3 text-sm text-slate-500">
                  <span className="font-medium text-slate-700">Notes:</span>{" "}
                  {entry.performanceNotes}
                </p>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
