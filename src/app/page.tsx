import Link from "next/link";
import { StatusBadge } from "@/components/status-badge";
import { prisma } from "@/lib/prisma";
import { POST_STATUSES, STATUS_LABELS, type PostStatus } from "@/lib/workflow";
import { getCurrentUser } from "@/lib/session";

// This page reads live data. Without this, Next prerenders it at build time and
// the numbers never change again.
export const dynamic = "force-dynamic";

const dateFormat = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
  timeZone: "UTC",
});

const RHYTHM = [
  { day: "Monday", focus: "Recruitment / Community Impact" },
  { day: "Wednesday", focus: "Alumni Spotlight / Program Experience" },
  { day: "Friday", focus: "Leadership Thought / Alumni Engagement" },
];

const PRIORITIES = [
  "Recruitment Campaign",
  "Social Media Content Planning",
  "Automation Research",
  "Vendor Evaluation",
];

export default async function DashboardPage() {
  // Every page resolves the session itself. proxy.ts is an optimistic redirect,
  // not access control, and a page must not be readable if it is bypassed.
  await getCurrentUser();

  const [posts, alumniCount, storiesCollected, bankCount, upcoming] =
    await Promise.all([
      prisma.post.findMany({ select: { status: true } }),
      prisma.alumnus.count(),
      prisma.alumnus.count({ where: { storyCollected: true } }),
      prisma.contentBankEntry.count(),
      prisma.post.findMany({
        where: { publishDate: { not: null } },
        include: { contentPillar: true },
        orderBy: { publishDate: "asc" },
        take: 5,
      }),
    ]);

  const counts = POST_STATUSES.map((status) => ({
    status,
    count: posts.filter((post) => post.status === status).length,
  }));

  return (
    <div className="mx-auto max-w-5xl">
      <header>
        <h1 className="text-2xl font-semibold text-slate-900">Dashboard</h1>
        <p className="mt-2 max-w-2xl text-sm text-slate-600">
          Transform CCF social media into a living archive of civic leadership
          where every alumni achievement, community impact story, and leadership
          milestone becomes a storytelling opportunity.
        </p>
      </header>

      <section className="mt-8">
        <h2 className="text-sm font-medium text-slate-500">
          Approval pipeline
        </h2>
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {counts.map(({ status, count }) => (
            <div
              key={status}
              className="rounded-lg border border-slate-200 bg-white px-3 py-3"
            >
              <p className="text-xs text-slate-500">{STATUS_LABELS[status]}</p>
              <p className="mt-1 text-2xl font-semibold text-slate-900">
                {count}
              </p>
            </div>
          ))}
        </div>
      </section>

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        <section className="lg:col-span-2">
          <div className="flex items-baseline justify-between">
            <h2 className="text-sm font-medium text-slate-500">Next up</h2>
            <Link
              href="/calendar"
              className="text-sm text-slate-600 hover:text-slate-900"
            >
              Open calendar
            </Link>
          </div>

          {upcoming.length === 0 ? (
            <p className="mt-3 rounded-lg border border-dashed border-slate-300 bg-white px-4 py-6 text-sm text-slate-500">
              No posts scheduled yet.
            </p>
          ) : (
            <ul className="mt-3 flex flex-col gap-2">
              {upcoming.map((post) => (
                <li
                  key={post.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-200 bg-white px-4 py-3"
                >
                  <div>
                    <p className="font-medium text-slate-900">{post.title}</p>
                    <p className="text-sm text-slate-500">
                      {post.publishDate
                        ? dateFormat.format(post.publishDate)
                        : "No date"}
                      {post.contentPillar
                        ? ` · ${post.contentPillar.name}`
                        : ""}
                    </p>
                  </div>
                  <StatusBadge status={post.status as PostStatus} />
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="flex flex-col gap-6">
          <div>
            <h2 className="text-sm font-medium text-slate-500">Archive</h2>
            <div className="mt-3 rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm">
              <p className="flex justify-between py-1 text-slate-700">
                <span>Alumni tracked</span>
                <span className="font-semibold">{alumniCount}</span>
              </p>
              <p className="flex justify-between py-1 text-slate-700">
                <span>Stories collected</span>
                <span className="font-semibold">{storiesCollected}</span>
              </p>
              <p className="flex justify-between py-1 text-slate-700">
                <span>Content bank ideas</span>
                <span className="font-semibold">{bankCount}</span>
              </p>
            </div>
          </div>

          <div>
            <h2 className="text-sm font-medium text-slate-500">
              Weekly rhythm
            </h2>
            <ul className="mt-3 rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm">
              {RHYTHM.map((entry) => (
                <li key={entry.day} className="py-1">
                  <span className="font-medium text-slate-900">
                    {entry.day}:
                  </span>{" "}
                  <span className="text-slate-600">{entry.focus}</span>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h2 className="text-sm font-medium text-slate-500">
              Current priorities
            </h2>
            <ul className="mt-3 rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600">
              {PRIORITIES.map((priority) => (
                <li key={priority} className="py-1">
                  {priority}
                </li>
              ))}
            </ul>
          </div>
        </section>
      </div>
    </div>
  );
}
