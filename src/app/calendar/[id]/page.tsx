import Link from "next/link";
import { notFound } from "next/navigation";
import { PostPreview } from "@/components/post-preview";
import { StatusBadge } from "@/components/status-badge";
import { secondaryButtonClass } from "@/components/ui";
import { alumnusDisplayName } from "@/lib/alumni";
import { formatDayLong, formatMedium } from "@/lib/dates";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import {
  GRAPHIC_STATUS_LABELS,
  PLATFORM_LABELS,
  STATUS_LABELS,
  canTransition,
  nextStatus,
  previousStatus,
  type GraphicStatus,
  type Platform,
  type PostStatus,
  type Role,
} from "@/lib/workflow";
import { movePost } from "../actions";

export default async function PostDetailPage({
  params,
}: PageProps<"/calendar/[id]">) {
  const { id } = await params;
  const [post, user] = await Promise.all([
    prisma.post.findUnique({
      where: { id },
      select: {
        id: true,
        title: true,
        status: true,
        platform: true,
        caption: true,
        graphicUrl: true,
        graphicStatus: true,
        publishDate: true,
        contentPillar: { select: { name: true } },
        owner: { select: { name: true } },
        alumnus: { select: { id: true, firstName: true, lastName: true } },
        approvalEvents: {
          select: {
            id: true,
            fromStatus: true,
            toStatus: true,
            note: true,
            createdAt: true,
            actor: { select: { name: true } },
          },
          orderBy: { createdAt: "desc" },
        },
      },
    }),
    getCurrentUser(),
  ]);

  if (!post) notFound();

  const status = post.status as PostStatus;
  const role = user.role as Role;
  const forward = nextStatus(status);
  const back = previousStatus(status);

  const facts: Array<[string, React.ReactNode]> = [
    [
      "Publish date",
      post.publishDate ? formatDayLong.format(post.publishDate) : "Not scheduled",
    ],
    [
      "Platform",
      post.platform ? PLATFORM_LABELS[post.platform as Platform] : "Not set",
    ],
    ["Content pillar", post.contentPillar?.name ?? "Not set"],
    [
      "About",
      post.alumnus ? (
        <Link
          href={`/alumni/${post.alumnus.id}`}
          className="underline underline-offset-2"
        >
          {alumnusDisplayName(post.alumnus)}
        </Link>
      ) : (
        "—"
      ),
    ],
    [
      "Graphic",
      GRAPHIC_STATUS_LABELS[post.graphicStatus as GraphicStatus],
    ],
    ["Owner", post.owner?.name ?? "Unassigned"],
  ];

  return (
    <div className="mx-auto max-w-5xl">
      <Link
        href="/calendar"
        className="text-sm text-slate-500 hover:text-slate-900"
      >
        ← Calendar
      </Link>

      <header className="mt-2 flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-semibold text-slate-900">
              {post.title}
            </h1>
            <StatusBadge status={status} />
          </div>
        </div>
        <Link href={`/calendar/${post.id}/edit`} className={secondaryButtonClass}>
          Edit post
        </Link>
      </header>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="flex flex-col gap-6">
          <section className="rounded-lg border border-slate-200 bg-white">
            <dl className="divide-y divide-slate-100 text-sm">
              {facts.map(([label, value]) => (
                <div
                  key={label}
                  className="flex justify-between gap-4 px-4 py-3"
                >
                  <dt className="text-slate-500">{label}</dt>
                  <dd className="text-right font-medium text-slate-900">
                    {value}
                  </dd>
                </div>
              ))}
            </dl>
          </section>

          <section>
            <h2 className="text-sm font-medium text-slate-500">
              Move through the pipeline
            </h2>
            <div className="mt-2 flex flex-wrap gap-2">
              {back ? (
                <form action={movePost}>
                  <input type="hidden" name="postId" value={post.id} />
                  <input type="hidden" name="direction" value="back" />
                  <button type="submit" className={secondaryButtonClass}>
                    Back to {STATUS_LABELS[back]}
                  </button>
                </form>
              ) : null}

              {forward ? (
                <form action={movePost}>
                  <input type="hidden" name="postId" value={post.id} />
                  <input type="hidden" name="direction" value="forward" />
                  <button
                    type="submit"
                    disabled={!canTransition(role, forward)}
                    className="inline-flex items-center rounded-md bg-slate-900 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                  >
                    {forward === "APPROVED"
                      ? "Approve"
                      : `Move to ${STATUS_LABELS[forward]}`}
                  </button>
                </form>
              ) : (
                <p className="text-sm text-slate-500">
                  This post is published — the end of the pipeline.
                </p>
              )}
            </div>
            {forward === "APPROVED" && !canTransition(role, forward) ? (
              <p className="mt-2 text-xs text-slate-500">
                Approving is limited to Admin and Reviewer roles.
              </p>
            ) : null}
          </section>

          <section>
            <h2 className="text-sm font-medium text-slate-500">History</h2>
            <ul className="mt-2 flex flex-col gap-2">
              {post.approvalEvents.map((event) => (
                <li
                  key={event.id}
                  className="rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm"
                >
                  <span className="font-medium text-slate-900">
                    {event.fromStatus
                      ? `${STATUS_LABELS[event.fromStatus as PostStatus]} → ${STATUS_LABELS[event.toStatus as PostStatus]}`
                      : STATUS_LABELS[event.toStatus as PostStatus]}
                  </span>
                  <span className="text-slate-500">
                    {" "}
                    · {event.actor?.name ?? "Unknown"} ·{" "}
                    {formatMedium.format(event.createdAt)}
                  </span>
                  {event.note ? (
                    <p className="mt-1 text-slate-600">{event.note}</p>
                  ) : null}
                </li>
              ))}
            </ul>
          </section>
        </div>

        <div>
          <h2 className="text-sm font-medium text-slate-500">Preview</h2>
          <div className="mt-2">
            <PostPreview
              platform={post.platform}
              caption={post.caption}
              graphicStatus={post.graphicStatus}
              imageUrl={post.graphicUrl}
            />
          </div>
          {!post.caption ? (
            <p className="mt-3 text-sm text-slate-500">
              <Link
                href={`/calendar/${post.id}/edit`}
                className="underline underline-offset-2"
              >
                Write the caption
              </Link>{" "}
              to see it here.
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
