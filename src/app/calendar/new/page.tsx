import Link from "next/link";
import { PostForm } from "@/components/post-form";
import { prisma } from "@/lib/prisma";
import { createPost } from "../actions";
import { getCurrentUser } from "@/lib/session";

export default async function NewPostPage({
  searchParams,
}: PageProps<"/calendar/new">) {
  // Every page resolves the session itself. proxy.ts is an optimistic redirect,
  // not access control, and a page must not be readable if it is bypassed.
  await getCurrentUser();

  const params = await searchParams;
  const [pillars, alumni, bankEntry] = await Promise.all([
    prisma.contentPillar.findMany({
      select: { id: true, name: true },
      orderBy: { sortOrder: "asc" },
    }),
    prisma.alumnus.findMany({
      select: { id: true, firstName: true, lastName: true },
      orderBy: [{ firstName: "asc" }, { lastName: "asc" }],
    }),
    // Arriving from "Use in calendar" in the Content Bank pre-fills the draft.
    typeof params.fromBank === "string"
      ? prisma.contentBankEntry.findUnique({
          where: { id: params.fromBank },
          select: {
            idea: true,
            captionDraft: true,
            contentPillarId: true,
            graphicNeeded: true,
          },
        })
      : null,
  ]);

  return (
    <div className="mx-auto max-w-3xl">
      <Link
        href="/calendar"
        className="text-sm text-slate-500 hover:text-slate-900"
      >
        ← Calendar
      </Link>
      <h1 className="mt-2 text-2xl font-semibold text-slate-900">New post</h1>
      <p className="mt-1 text-sm text-slate-600">
        Starts as an Idea. You can move it through the pipeline once it is saved.
      </p>

      <div className="mt-6">
        <PostForm
          action={createPost}
          pillars={pillars}
          alumni={alumni}
          submitLabel="Create post"
          cancelHref="/calendar"
          values={{
            title: bankEntry?.idea ?? "",
            caption: bankEntry?.captionDraft ?? null,
            graphicUrl: null,
            platform: null,
            graphicStatus: bankEntry?.graphicNeeded ? "NOT_STARTED" : "READY",
            publishDate: null,
            contentPillarId: bankEntry?.contentPillarId ?? null,
            alumnusId: null,
          }}
        />
      </div>
    </div>
  );
}
