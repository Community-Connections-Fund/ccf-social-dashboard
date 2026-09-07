import Link from "next/link";
import { notFound } from "next/navigation";
import { PostForm } from "@/components/post-form";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import type { Role } from "@/lib/workflow";
import { deletePost, updatePost } from "../../actions";

export default async function EditPostPage({
  params,
}: PageProps<"/calendar/[id]/edit">) {
  const { id } = await params;
  const [post, pillars, alumni, user] = await Promise.all([
    prisma.post.findUnique({
      where: { id },
      select: {
        id: true,
        title: true,
        caption: true,
        graphicUrl: true,
        platform: true,
        graphicStatus: true,
        publishDate: true,
        contentPillarId: true,
        alumnusId: true,
        reach: true,
        engagement: true,
        clicks: true,
      },
    }),
    prisma.contentPillar.findMany({
      select: { id: true, name: true },
      orderBy: { sortOrder: "asc" },
    }),
    prisma.alumnus.findMany({
      select: { id: true, firstName: true, lastName: true },
      orderBy: [{ firstName: "asc" }, { lastName: "asc" }],
    }),
    getCurrentUser(),
  ]);

  if (!post) notFound();

  return (
    <div className="mx-auto max-w-3xl">
      <Link
        href={`/calendar/${post.id}`}
        className="text-sm text-slate-500 hover:text-slate-900"
      >
        ← Back to post
      </Link>
      <h1 className="mt-2 text-2xl font-semibold text-slate-900">Edit post</h1>

      <div className="mt-6">
        <PostForm
          action={updatePost}
          values={post}
          pillars={pillars}
          alumni={alumni}
          submitLabel="Save changes"
          cancelHref={`/calendar/${post.id}`}
        />
      </div>

      {(user.role as Role) === "ADMIN" ? (
        <form
          action={deletePost}
          className="mt-10 border-t border-slate-200 pt-6"
        >
          <input type="hidden" name="postId" value={post.id} />
          <button
            type="submit"
            className="text-sm font-medium text-red-700 underline underline-offset-2 hover:text-red-800"
          >
            Delete this post
          </button>
        </form>
      ) : null}
    </div>
  );
}
