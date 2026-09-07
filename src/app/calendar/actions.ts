"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import {
  canTransition,
  isPostStatus,
  nextStatus,
  previousStatus,
  type Role,
} from "@/lib/workflow";

export async function movePost(formData: FormData) {
  const postId = String(formData.get("postId") ?? "");
  const direction = String(formData.get("direction") ?? "");

  const user = await getCurrentUser();
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
        actorId: user.id,
      },
    }),
  ]);

  revalidatePath("/calendar");
  revalidatePath("/");
}
