"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { dateFromKey } from "@/lib/dates";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import type { Role } from "@/lib/workflow";

function text(formData: FormData, key: string): string | null {
  const value = formData.get(key);
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
}

function entryFieldsFrom(formData: FormData) {
  const lastPosted = text(formData, "lastPosted");

  return {
    idea: text(formData, "idea") ?? "Untitled idea",
    captionDraft: text(formData, "captionDraft"),
    contentPillarId: text(formData, "contentPillarId"),
    performanceNotes: text(formData, "performanceNotes"),
    evergreen: formData.get("evergreen") === "on",
    graphicNeeded: formData.get("graphicNeeded") === "on",
    lastPosted: lastPosted ? dateFromKey(lastPosted) : null,
  };
}

async function requireEditor() {
  const user = await getCurrentUser();
  if ((user.role as Role) === "VIEWER") {
    throw new Error("Your role cannot change the content bank.");
  }
  return user;
}

export async function createBankEntry(formData: FormData) {
  await requireEditor();
  await prisma.contentBankEntry.create({ data: entryFieldsFrom(formData) });

  revalidatePath("/content-bank");
  redirect("/content-bank");
}

export async function updateBankEntry(formData: FormData) {
  await requireEditor();
  const id = String(formData.get("entryId") ?? "");
  if (!id) throw new Error("Missing entry id.");

  await prisma.contentBankEntry.update({
    where: { id },
    data: entryFieldsFrom(formData),
  });

  revalidatePath("/content-bank");
  redirect("/content-bank");
}

export async function deleteBankEntry(formData: FormData) {
  const user = await getCurrentUser();
  if ((user.role as Role) !== "ADMIN") {
    throw new Error("Only an admin can delete a content bank entry.");
  }

  const id = String(formData.get("entryId") ?? "");
  if (!id) throw new Error("Missing entry id.");

  await prisma.contentBankEntry.delete({ where: { id } });

  revalidatePath("/content-bank");
  redirect("/content-bank");
}
