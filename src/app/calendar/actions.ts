"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { dateFromKey } from "@/lib/dates";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import {
  GRAPHIC_STATUSES,
  PLATFORMS,
  canTransition,
  isPostStatus,
  nextStatus,
  previousStatus,
  type GraphicStatus,
  type Platform,
  type Role,
} from "@/lib/workflow";

function text(formData: FormData, key: string): string | null {
  const value = formData.get(key);
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
}

function optionOrNull<T extends string>(
  value: string | null,
  allowed: readonly T[],
): T | null {
  return value && (allowed as readonly string[]).includes(value)
    ? (value as T)
    : null;
}

// Blank stays blank: a post nobody has measured is not a post that scored zero,
// and zeroes would drag the top-performing ranking into fiction.
function count(formData: FormData, key: string): number | null {
  const raw = String(formData.get(key) ?? "").trim();
  if (raw === "") return null;
  const value = Number(raw);
  return Number.isFinite(value) && value >= 0 ? Math.round(value) : null;
}

/** Shared shape for create and edit, so the two cannot drift apart. */
function postFieldsFrom(formData: FormData) {
  const publishDate = text(formData, "publishDate");

  return {
    title: text(formData, "title") ?? "Untitled post",
    caption: text(formData, "caption"),
    graphicUrl: text(formData, "graphicUrl"),
    platform: optionOrNull<Platform>(text(formData, "platform"), PLATFORMS),
    graphicStatus:
      optionOrNull<GraphicStatus>(
        text(formData, "graphicStatus"),
        GRAPHIC_STATUSES,
      ) ?? "NOT_STARTED",
    publishDate: publishDate ? dateFromKey(publishDate) : null,
    contentPillarId: text(formData, "contentPillarId"),
    alumnusId: text(formData, "alumnusId"),
    reach: count(formData, "reach"),
    engagement: count(formData, "engagement"),
    clicks: count(formData, "clicks"),
  };
}

async function requireEditor() {
  const user = await getCurrentUser();
  if ((user.role as Role) === "VIEWER") {
    throw new Error("Your role cannot change posts.");
  }
  return user;
}

export async function createPost(formData: FormData) {
  const user = await requireEditor();
  const fields = postFieldsFrom(formData);

  const post = await prisma.post.create({
    data: { ...fields, status: "IDEA", ownerId: user.id },
  });

  await prisma.approvalEvent.create({
    data: {
      postId: post.id,
      fromStatus: null,
      toStatus: "IDEA",
      note: "Created",
      actorId: user.id,
    },
  });

  revalidatePath("/calendar");
  revalidatePath("/");
  redirect(`/calendar/${post.id}`);
}

export async function updatePost(formData: FormData) {
  await requireEditor();
  const id = String(formData.get("postId") ?? "");
  if (!id) throw new Error("Missing post id.");

  await prisma.post.update({
    where: { id },
    data: postFieldsFrom(formData),
  });

  revalidatePath("/calendar");
  revalidatePath(`/calendar/${id}`);
  revalidatePath("/");
  redirect(`/calendar/${id}`);
}

export async function movePost(formData: FormData) {
  const postId = String(formData.get("postId") ?? "");
  const direction = String(formData.get("direction") ?? "");

  const user = await requireEditor();
  const post = await prisma.post.findUniqueOrThrow({ where: { id: postId } });

  if (!isPostStatus(post.status)) {
    throw new Error(`Post ${postId} has an unrecognized status: ${post.status}`);
  }

  const target =
    direction === "forward"
      ? nextStatus(post.status)
      : direction === "back"
        ? previousStatus(post.status)
        : null;

  if (!target) return;

  if (!canTransition(user.role as Role, target)) {
    throw new Error(`${user.role} is not allowed to move a post to ${target}`);
  }

  await prisma.$transaction([
    prisma.post.update({ where: { id: postId }, data: { status: target } }),
    prisma.approvalEvent.create({
      data: {
        postId,
        fromStatus: post.status,
        toStatus: target,
        note: text(formData, "note"),
        actorId: user.id,
      },
    }),
  ]);

  revalidatePath("/calendar");
  revalidatePath(`/calendar/${postId}`);
  revalidatePath("/");
}

export async function deletePost(formData: FormData) {
  const user = await getCurrentUser();
  if ((user.role as Role) !== "ADMIN") {
    throw new Error("Only an admin can delete a post.");
  }

  const id = String(formData.get("postId") ?? "");
  if (!id) throw new Error("Missing post id.");

  await prisma.post.delete({ where: { id } });

  revalidatePath("/calendar");
  revalidatePath("/");
  redirect("/calendar");
}
