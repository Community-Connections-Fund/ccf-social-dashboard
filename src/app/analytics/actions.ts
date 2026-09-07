"use server";

import { revalidatePath } from "next/cache";
import { dateFromKey } from "@/lib/dates";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { PLATFORMS, type Platform, type Role } from "@/lib/workflow";

// Blank stays blank: a metric nobody recorded is null, not zero. Storing zero
// would put a false trough in the growth numbers leadership reads.
function count(formData: FormData, key: string): number | null {
  const raw = String(formData.get(key) ?? "").trim();
  if (raw === "") return null;
  const value = Number(raw);
  return Number.isFinite(value) && value >= 0 ? Math.round(value) : null;
}

export async function addSnapshot(formData: FormData) {
  const user = await getCurrentUser();
  if ((user.role as Role) === "VIEWER") {
    throw new Error("Your role cannot record analytics.");
  }

  const start = String(formData.get("periodStart") ?? "");
  const end = String(formData.get("periodEnd") ?? "");
  const rawPlatform = String(formData.get("platform") ?? "");

  if (!start || !end) throw new Error("Both dates are required.");
  if (!(PLATFORMS as readonly string[]).includes(rawPlatform)) {
    throw new Error("Choose a platform.");
  }

  const periodStart = dateFromKey(start);
  const periodEnd = dateFromKey(end);
  if (periodEnd < periodStart) {
    throw new Error("The end date cannot be before the start date.");
  }

  await prisma.analyticsSnapshot.create({
    data: {
      periodStart,
      periodEnd,
      platform: rawPlatform as Platform,
      followers: count(formData, "followers"),
      reach: count(formData, "reach"),
      engagement: count(formData, "engagement"),
      impressions: count(formData, "impressions"),
      clicks: count(formData, "clicks"),
      notes: (String(formData.get("notes") ?? "").trim() || null) as
        | string
        | null,
    },
  });

  revalidatePath("/analytics");
}

export async function deleteSnapshot(formData: FormData) {
  const user = await getCurrentUser();
  if ((user.role as Role) === "VIEWER") {
    throw new Error("Your role cannot change analytics.");
  }

  const id = String(formData.get("snapshotId") ?? "");
  if (!id) throw new Error("Missing entry id.");

  await prisma.analyticsSnapshot.delete({ where: { id } });
  revalidatePath("/analytics");
}
