import { StatusBadge } from "@/components/status-badge";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import {
  GRAPHIC_STATUS_LABELS,
  PLATFORM_LABELS,
  POST_STATUSES,
  STATUS_LABELS,
  canTransition,
  nextStatus,
  previousStatus,
  type GraphicStatus,
  type Platform,
  type PostStatus,
  type Role,
} from "@/lib/workflow";
import { movePost } from "./actions";

// Publish dates are calendar dates, stored at UTC midnight. Formatting them in UTC
// keeps the day stable no matter what timezone the server or the viewer is in.
const dateFormat = new Intl.DateTimeFormat("en-US", {
  weekday: "short",
  month: "short",
  day: "numeric",
  year: "numeric",
  timeZone: "UTC",
});

export default async function CalendarPage() {
  const [posts, user] = await Promise.all([
    prisma.post.findMany({
      include: { contentPillar: true, owner: true, alumnus: true },
      orderBy: [{ publishDate: "asc" }, { createdAt: "asc" }],
    }),
    getCurrentUser(),
  ]);

  const role = user.role as Role;
  const scheduled = posts.filter((post) => post.publishDate);
  const undated = posts.filter((post) => !post.publishDate);

  const counts = POST_STATUSES.map((status) => ({
    status,
    count: posts.filter((post) => post.status === status).length,
  }));

  return (
    <div className="mx-auto max-w-5xl">
      <header>
        <h1 className="text-2xl font-semibold text-slate-900">
          Content Calendar
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          Every post moves through the same pipeline, and each move is recorded.
        </p>
      </header>

      <div className="mt-6 flex flex-wrap gap-2">
        {counts.map(({ status, count }) => (
          <div
            key={status}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2"
          >
            <p className="text-xs text-slate-500">{STATUS_LABELS[status]}</p>
            <p className="text-lg font-semibold text-slate-900">{count}</p>
          </div>
        ))}
      </div>

      <PostSection
        title="Scheduled"
        description="Posts with a publish date."
        posts={scheduled}
        role={role}
        emptyMessage="Nothing scheduled yet."
      />

      <PostSection
        title="Not yet scheduled"
        description="Ideas and drafts without a date."
        posts={undated}
        role={role}
        emptyMessage="No undated posts."
      />
    </div>
  );
}

type PostWithRelations = Awaited<
  ReturnType<
    typeof prisma.post.findMany<{
      include: { contentPillar: true; owner: true; alumnus: true };
    }>
  >
>[number];

function PostSection({
  title,
  description,
  posts,
  role,
  emptyMessage,
}: {
  title: string;
  description: string;
  posts: PostWithRelations[];
  role: Role;
  emptyMessage: string;
}) {
  return (
    <section className="mt-10">
      <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
      <p className="mt-0.5 text-sm text-slate-500">{description}</p>

      {posts.length === 0 ? (
        <p className="mt-4 rounded-lg border border-dashed border-slate-300 bg-white px-4 py-6 text-sm text-slate-500">
          {emptyMessage}
        </p>
      ) : (
        <ul className="mt-4 flex flex-col gap-3">
          {posts.map((post) => (
            <PostRow key={post.id} post={post} role={role} />
          ))}
        </ul>
      )}
    </section>
  );
}

function PostRow({ post, role }: { post: PostWithRelations; role: Role }) {
  const status = post.status as PostStatus;
  const forward = nextStatus(status);
  const back = previousStatus(status);

  const meta = [
    post.publishDate ? dateFormat.format(post.publishDate) : null,
    post.platform ? PLATFORM_LABELS[post.platform as Platform] : null,
    post.contentPillar?.name ?? null,
    `Graphic: ${GRAPHIC_STATUS_LABELS[post.graphicStatus as GraphicStatus]}`,
    post.owner ? `Owner: ${post.owner.name}` : null,
  ].filter(Boolean) as string[];

  return (
    <li className="rounded-lg border border-slate-200 bg-white p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-medium text-slate-900">{post.title}</h3>
            <StatusBadge status={status} />
          </div>
          <p className="mt-1 text-sm text-slate-500">{meta.join(" · ")}</p>
          {post.caption ? (
            <p className="mt-2 text-sm text-slate-700">{post.caption}</p>
          ) : null}
        </div>

        <div className="flex shrink-0 gap-2">
          {back ? (
            <form action={movePost}>
              <input type="hidden" name="postId" value={post.id} />
              <input type="hidden" name="direction" value="back" />
              <button
                type="submit"
                className="rounded-md border border-slate-300 px-2.5 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-50"
              >
                Back
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
                className="rounded-md bg-slate-900 px-2.5 py-1.5 text-xs font-medium text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                {forward === "APPROVED"
                  ? "Approve"
                  : `Move to ${STATUS_LABELS[forward]}`}
              </button>
            </form>
          ) : null}
        </div>
      </div>
    </li>
  );
}
