import Link from "next/link";
import { buttonClass, secondaryButtonClass } from "@/components/ui";
import {
  addMonths,
  addDays,
  dateFromKey,
  formatDayLong,
  formatMonthYear,
  isSameMonth,
  monthGrid,
  startOfWeek,
  toDateKey,
  todayUtc,
  weekDays,
} from "@/lib/dates";
import { prisma } from "@/lib/prisma";
import {
  PLATFORMS,
  PLATFORM_LABELS,
  POST_STATUSES,
  STATUS_LABELS,
  STATUS_STYLES,
  type Platform,
  type PostStatus,
} from "@/lib/workflow";
import { getCurrentUser } from "@/lib/session";

type CalendarPost = {
  id: string;
  title: string;
  status: string;
  platform: string | null;
  publishDate: Date | null;
};

const WEEKDAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default async function CalendarPage({
  searchParams,
}: PageProps<"/calendar">) {
  // Every page resolves the session itself. proxy.ts is an optimistic redirect,
  // not access control, and a page must not be readable if it is bypassed.
  await getCurrentUser();

  const params = await searchParams;
  const view = params.view === "week" ? "week" : "month";
  const platformFilter =
    typeof params.platform === "string" &&
    (PLATFORMS as readonly string[]).includes(params.platform)
      ? params.platform
      : null;

  const posts = await prisma.post.findMany({
    select: {
      id: true,
      title: true,
      status: true,
      platform: true,
      publishDate: true,
    },
    where: platformFilter ? { platform: platformFilter } : undefined,
    orderBy: [{ publishDate: "asc" }, { createdAt: "asc" }],
  });

  const dated = posts.filter(
    (post): post is CalendarPost & { publishDate: Date } => !!post.publishDate,
  );
  const undated = posts.filter((post) => !post.publishDate);

  // Opening on an empty month reads as a broken page. With no explicit date in
  // the URL, fall back to the month nearest to today that actually has posts.
  const anchorParam = typeof params.date === "string" ? params.date : null;
  let anchor = anchorParam ? dateFromKey(anchorParam) : todayUtc();

  if (!anchorParam && dated.length > 0) {
    const hasPostsThisMonth = dated.some((post) =>
      isSameMonth(post.publishDate, anchor),
    );
    if (!hasPostsThisMonth) {
      const target = anchor.getTime();
      anchor = dated.reduce((closest, post) =>
        Math.abs(post.publishDate.getTime() - target) <
        Math.abs(closest.publishDate.getTime() - target)
          ? post
          : closest,
      ).publishDate;
    }
  }

  const byDate = new Map<string, CalendarPost[]>();
  for (const post of dated) {
    const key = toDateKey(post.publishDate);
    byDate.set(key, [...(byDate.get(key) ?? []), post]);
  }

  const weeks = view === "week" ? [weekDays(anchor)] : monthGrid(anchor);
  const today = toDateKey(todayUtc());

  const step = (delta: number) => {
    const target =
      view === "week"
        ? addDays(startOfWeek(anchor), delta * 7)
        : addMonths(anchor, delta);
    return buildHref({ view, platform: platformFilter, date: toDateKey(target) });
  };

  const heading =
    view === "week"
      ? `Week of ${formatDayLong.format(startOfWeek(anchor))}`
      : formatMonthYear.format(anchor);

  return (
    <div className="mx-auto max-w-6xl">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">
            Content Calendar
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            {posts.length} post{posts.length === 1 ? "" : "s"}
            {platformFilter
              ? ` on ${PLATFORM_LABELS[platformFilter as Platform]}`
              : ""}
          </p>
        </div>
        <Link href="/calendar/new" className={buttonClass}>
          New post
        </Link>
      </header>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Link href={step(-1)} className={secondaryButtonClass}>
            ←
          </Link>
          <h2 className="min-w-48 text-center text-lg font-medium text-slate-900">
            {heading}
          </h2>
          <Link href={step(1)} className={secondaryButtonClass}>
            →
          </Link>
          <Link
            href={buildHref({ view, platform: platformFilter, date: null })}
            className="ml-1 text-sm text-slate-500 hover:text-slate-900"
          >
            Today
          </Link>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex overflow-hidden rounded-md border border-slate-300">
            {(["month", "week"] as const).map((option) => (
              <Link
                key={option}
                href={buildHref({
                  view: option,
                  platform: platformFilter,
                  date: toDateKey(anchor),
                })}
                className={`px-3 py-1.5 text-sm font-medium capitalize ${
                  view === option
                    ? "bg-slate-900 text-white"
                    : "bg-white text-slate-700 hover:bg-slate-50"
                }`}
              >
                {option}
              </Link>
            ))}
          </div>

          <div className="flex flex-wrap gap-1">
            <Link
              href={buildHref({
                view,
                platform: null,
                date: toDateKey(anchor),
              })}
              className={`rounded-md px-2 py-1 text-xs font-medium ${
                platformFilter
                  ? "text-slate-600 hover:bg-slate-100"
                  : "bg-slate-900 text-white"
              }`}
            >
              All
            </Link>
            {PLATFORMS.map((platform) => (
              <Link
                key={platform}
                href={buildHref({
                  view,
                  platform,
                  date: toDateKey(anchor),
                })}
                className={`rounded-md px-2 py-1 text-xs font-medium ${
                  platformFilter === platform
                    ? "bg-slate-900 text-white"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                {PLATFORM_LABELS[platform]}
              </Link>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-4 overflow-hidden rounded-lg border border-slate-200 bg-white">
        <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50">
          {WEEKDAY_NAMES.map((day) => (
            <div
              key={day}
              className="px-2 py-2 text-center text-xs font-medium uppercase tracking-wide text-slate-500"
            >
              {day}
            </div>
          ))}
        </div>

        {weeks.map((week) => (
          <div
            key={toDateKey(week[0])}
            className="grid grid-cols-7 border-b border-slate-100 last:border-b-0"
          >
            {week.map((day) => {
              const key = toDateKey(day);
              const dayPosts = byDate.get(key) ?? [];
              const outsideMonth = view === "month" && !isSameMonth(day, anchor);

              return (
                <div
                  key={key}
                  className={`min-h-28 border-r border-slate-100 p-1.5 last:border-r-0 ${
                    outsideMonth ? "bg-slate-50/60" : ""
                  } ${view === "week" ? "min-h-64" : ""}`}
                >
                  <div className="flex items-center justify-between px-0.5">
                    <span
                      className={`text-xs ${
                        key === today
                          ? "flex h-5 w-5 items-center justify-center rounded-full bg-slate-900 font-semibold text-white"
                          : outsideMonth
                            ? "text-slate-400"
                            : "text-slate-600"
                      }`}
                    >
                      {day.getUTCDate()}
                    </span>
                  </div>

                  <div className="mt-1 flex flex-col gap-1">
                    {dayPosts.map((post) => (
                      <Link
                        key={post.id}
                        href={`/calendar/${post.id}`}
                        className={`block rounded px-1.5 py-1 text-xs ring-1 ring-inset transition hover:brightness-95 ${STATUS_STYLES[post.status as PostStatus]}`}
                      >
                        <span className="block truncate font-medium">
                          {post.title}
                        </span>
                        <span className="block truncate text-[10px] opacity-80">
                          {post.platform
                            ? PLATFORM_LABELS[post.platform as Platform]
                            : "No platform"}{" "}
                          · {STATUS_LABELS[post.status as PostStatus]}
                        </span>
                      </Link>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>

      <div className="mt-4 flex flex-wrap gap-3 text-xs text-slate-500">
        {POST_STATUSES.map((status) => (
          <span key={status} className="flex items-center gap-1.5">
            <span
              className={`h-2.5 w-2.5 rounded-full ring-1 ring-inset ${STATUS_STYLES[status]}`}
            />
            {STATUS_LABELS[status]}
          </span>
        ))}
      </div>

      <section className="mt-8">
        <h2 className="text-sm font-medium text-slate-500">
          Not yet scheduled ({undated.length})
        </h2>
        {undated.length === 0 ? (
          <p className="mt-2 text-sm text-slate-500">
            Everything has a date on it.
          </p>
        ) : (
          <ul className="mt-2 flex flex-wrap gap-2">
            {undated.map((post) => (
              <li key={post.id}>
                <Link
                  href={`/calendar/${post.id}`}
                  className={`block rounded-md px-2.5 py-1.5 text-xs font-medium ring-1 ring-inset transition hover:brightness-95 ${STATUS_STYLES[post.status as PostStatus]}`}
                >
                  {post.title}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function buildHref({
  view,
  platform,
  date,
}: {
  view: string;
  platform: string | null;
  date: string | null;
}) {
  const query = new URLSearchParams();
  if (view === "week") query.set("view", "week");
  if (platform) query.set("platform", platform);
  if (date) query.set("date", date);
  const suffix = query.toString();
  return suffix ? `/calendar?${suffix}` : "/calendar";
}
