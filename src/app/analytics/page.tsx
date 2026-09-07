import { Field, buttonClass, inputClass } from "@/components/ui";
import { prisma } from "@/lib/prisma";
import { PLATFORMS, PLATFORM_LABELS, type Platform } from "@/lib/workflow";
import { getCurrentUser } from "@/lib/session";
import { addSnapshot } from "./actions";

// This page reads live data. Without this, Next prerenders it at build time and
// the numbers never change again.
export const dynamic = "force-dynamic";

const dateFormat = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  timeZone: "UTC",
});

export default async function AnalyticsPage() {
  // Every page resolves the session itself. proxy.ts is an optimistic redirect,
  // not access control, and a page must not be readable if it is bypassed.
  await getCurrentUser();

  const snapshots = await prisma.analyticsSnapshot.findMany({
    orderBy: { periodStart: "desc" },
    take: 24,
  });

  return (
    <div className="mx-auto max-w-5xl">
      <header>
        <h1 className="text-2xl font-semibold text-slate-900">Analytics</h1>
        <p className="mt-1 text-sm text-slate-600">
          Weekly or monthly numbers recorded by hand, so leadership can see
          growth over time.
        </p>
      </header>

      <section className="mt-6 rounded-lg border border-slate-200 bg-white p-4">
        <h2 className="text-sm font-medium text-slate-900">Record numbers</h2>
        <p className="mt-1 text-xs text-slate-500">
          One entry per platform per period. Leave a box blank if you did not
          record it — blank is kept as “not recorded” rather than zero.
        </p>

        <form action={addSnapshot} className="mt-3 flex flex-col gap-3">
          <div className="grid gap-3 sm:grid-cols-3">
            <Field label="Period start" htmlFor="periodStart">
              <input
                id="periodStart"
                name="periodStart"
                type="date"
                required
                className={inputClass}
              />
            </Field>
            <Field label="Period end" htmlFor="periodEnd">
              <input
                id="periodEnd"
                name="periodEnd"
                type="date"
                required
                className={inputClass}
              />
            </Field>
            <Field label="Platform" htmlFor="platform">
              <select id="platform" name="platform" className={inputClass}>
                {PLATFORMS.map((platform) => (
                  <option key={platform} value={platform}>
                    {PLATFORM_LABELS[platform]}
                  </option>
                ))}
              </select>
            </Field>
          </div>

          <div className="grid gap-3 sm:grid-cols-5">
            {(
              [
                ["followers", "Followers"],
                ["reach", "Reach"],
                ["engagement", "Engagement"],
                ["impressions", "Impressions"],
                ["clicks", "Clicks"],
              ] as const
            ).map(([name, label]) => (
              <Field key={name} label={label} htmlFor={name}>
                <input
                  id={name}
                  name={name}
                  type="number"
                  min={0}
                  className={inputClass}
                />
              </Field>
            ))}
          </div>

          <Field label="Notes" htmlFor="notes">
            <input
              id="notes"
              name="notes"
              className={inputClass}
              placeholder="What drove the change this period."
            />
          </Field>

          <div>
            <button type="submit" className={buttonClass}>
              Save entry
            </button>
          </div>
        </form>
      </section>

      {snapshots.length === 0 ? (
        <div className="mt-6 rounded-lg border border-dashed border-slate-300 bg-white px-4 py-6">
          <p className="text-sm text-slate-600">
            No numbers recorded yet. Each entry will capture followers, reach,
            engagement, impressions, and clicks for one platform over one
            period.
          </p>
        </div>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-lg border border-slate-200 bg-white">
          <table className="min-w-full text-sm">
            <thead className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3 font-medium">Period</th>
                <th className="px-4 py-3 font-medium">Platform</th>
                <th className="px-4 py-3 font-medium">Followers</th>
                <th className="px-4 py-3 font-medium">Reach</th>
                <th className="px-4 py-3 font-medium">Engagement</th>
                <th className="px-4 py-3 font-medium">Clicks</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {snapshots.map((snapshot) => (
                <tr key={snapshot.id}>
                  <td className="px-4 py-3 text-slate-600">
                    {dateFormat.format(snapshot.periodStart)} –{" "}
                    {dateFormat.format(snapshot.periodEnd)}
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {PLATFORM_LABELS[snapshot.platform as Platform]}
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {snapshot.followers ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {snapshot.reach ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {snapshot.engagement ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {snapshot.clicks ?? "—"}
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
