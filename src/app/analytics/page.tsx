import Link from "next/link";
import { GrowthChart, type GrowthSeries } from "@/components/growth-chart";
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

  const [snapshots, topPosts] = await Promise.all([
    prisma.analyticsSnapshot.findMany({
      orderBy: { periodStart: "desc" },
      take: 24,
    }),
    // Only published posts that actually have a number recorded — an unmeasured
    // post is not a poorly performing one, and ranking it as such would be a lie.
    prisma.post.findMany({
      where: { status: "PUBLISHED", engagement: { not: null } },
      select: {
        id: true,
        title: true,
        platform: true,
        publishDate: true,
        engagement: true,
        reach: true,
        clicks: true,
        contentPillar: { select: { name: true } },
      },
      orderBy: { engagement: "desc" },
      take: 10,
    }),
  ]);

  // Followers over time, one line per platform, oldest first.
  const growth: GrowthSeries[] = PLATFORMS.map((platform) => ({
    platform,
    label: PLATFORM_LABELS[platform],
    points: snapshots
      .filter((s) => s.platform === platform && s.followers !== null)
      .sort((a, b) => a.periodStart.getTime() - b.periodStart.getTime())
      .map((s) => ({
        date: s.periodEnd.toISOString().slice(0, 10),
        label: dateFormat.format(s.periodEnd),
        value: s.followers as number,
      })),
  })).filter((series) => series.points.length > 0);

  const bestEngagement = topPosts[0]?.engagement ?? 0;

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

      {growth.length > 0 ? (
        <section className="mt-6 rounded-lg border border-slate-200 bg-white p-4">
          <h2 className="text-sm font-medium text-slate-900">
            Follower growth over time
          </h2>
          <div className="mt-3">
            <GrowthChart series={growth} />
          </div>
        </section>
      ) : null}

      <section className="mt-6 rounded-lg border border-slate-200 bg-white p-4">
        <h2 className="text-sm font-medium text-slate-900">
          Top performing posts
        </h2>
        {topPosts.length === 0 ? (
          <p className="mt-2 text-sm text-slate-500">
            Nothing to rank yet. Open a published post and record how it did —
            posts appear here once they have an engagement number.
          </p>
        ) : (
          <ol className="mt-3 flex flex-col gap-2">
            {topPosts.map((post, index) => (
              <li key={post.id} className="flex items-center gap-3">
                <span className="w-5 shrink-0 text-xs text-slate-400">
                  {index + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <Link
                    href={`/calendar/${post.id}`}
                    className="block truncate text-sm font-medium text-slate-900 hover:underline"
                  >
                    {post.title}
                  </Link>
                  <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-slate-900"
                      style={{
                        width: `${bestEngagement ? Math.max(4, ((post.engagement ?? 0) / bestEngagement) * 100) : 0}%`,
                      }}
                    />
                  </div>
                  <p className="mt-1 text-xs text-slate-500">
                    {[
                      post.platform
                        ? PLATFORM_LABELS[post.platform as Platform]
                        : null,
                      post.contentPillar?.name,
                      post.publishDate
                        ? dateFormat.format(post.publishDate)
                        : null,
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                </div>
                <div className="shrink-0 text-right text-xs text-slate-600">
                  <p className="font-medium text-slate-900">
                    {post.engagement?.toLocaleString()}
                  </p>
                  <p className="text-slate-400">engagement</p>
                </div>
              </li>
            ))}
          </ol>
        )}
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
