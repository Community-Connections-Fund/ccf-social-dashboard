import { prisma } from "@/lib/prisma";

const dateFormat = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
  timeZone: "UTC",
});

export default async function ContentBankPage() {
  const entries = await prisma.contentBankEntry.findMany({
    include: { contentPillar: true },
    orderBy: { createdAt: "asc" },
  });

  return (
    <div className="mx-auto max-w-5xl">
      <header>
        <h1 className="text-2xl font-semibold text-slate-900">Content Bank</h1>
        <p className="mt-1 text-sm text-slate-600">
          Reusable, evergreen content that can be pulled into the calendar
          whenever it is needed.
        </p>
      </header>

      {entries.length === 0 ? (
        <p className="mt-6 rounded-lg border border-dashed border-slate-300 bg-white px-4 py-6 text-sm text-slate-500">
          No content bank entries yet.
        </p>
      ) : (
        <ul className="mt-6 flex flex-col gap-3">
          {entries.map((entry) => (
            <li
              key={entry.id}
              className="rounded-lg border border-slate-200 bg-white p-4"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <h2 className="font-medium text-slate-900">{entry.idea}</h2>
                <div className="flex gap-2 text-xs">
                  {entry.evergreen ? (
                    <span className="rounded-full bg-emerald-100 px-2 py-0.5 font-medium text-emerald-800 ring-1 ring-inset ring-emerald-200">
                      Evergreen
                    </span>
                  ) : null}
                  {entry.graphicNeeded ? (
                    <span className="rounded-full bg-amber-100 px-2 py-0.5 font-medium text-amber-800 ring-1 ring-inset ring-amber-200">
                      Graphic needed
                    </span>
                  ) : null}
                </div>
              </div>

              <p className="mt-1 text-sm text-slate-500">
                {[
                  entry.contentPillar?.name,
                  entry.lastPosted
                    ? `Last posted ${dateFormat.format(entry.lastPosted)}`
                    : "Never posted",
                ]
                  .filter(Boolean)
                  .join(" · ")}
              </p>

              {entry.captionDraft ? (
                <p className="mt-2 text-sm text-slate-700">
                  {entry.captionDraft}
                </p>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
