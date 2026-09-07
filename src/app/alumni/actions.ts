"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { FEATURED_STATUSES, type FeaturedStatus, type Role } from "@/lib/workflow";

function text(formData: FormData, key: string): string | null {
  const value = formData.get(key);
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
}

function alumnusFieldsFrom(formData: FormData) {
  const cohortYear = text(formData, "cohortYear");
  const featured = text(formData, "featuredStatus");

  return {
    firstName: text(formData, "firstName") ?? "",
    lastName: text(formData, "lastName"),
    cohortYear: cohortYear ? Number(cohortYear) : null,
    currentOrganization: text(formData, "currentOrganization"),
    currentRole: text(formData, "currentRole"),
    boardMemberships: text(formData, "boardMemberships"),
    linkedin: text(formData, "linkedin"),
    personalEmail: text(formData, "personalEmail"),
    workEmail: text(formData, "workEmail"),
    careerUpdates: text(formData, "careerUpdates"),
    awards: text(formData, "awards"),
    storyCollected: formData.get("storyCollected") === "on",
    featuredStatus:
      featured && (FEATURED_STATUSES as readonly string[]).includes(featured)
        ? (featured as FeaturedStatus)
        : "NOT_FEATURED",
  };
}

async function requireEditor() {
  const user = await getCurrentUser();
  if ((user.role as Role) === "VIEWER") {
    throw new Error("Your role cannot change alumni records.");
  }
  return user;
}

export async function createAlumnus(formData: FormData) {
  await requireEditor();
  const fields = alumnusFieldsFrom(formData);
  if (!fields.firstName) throw new Error("A first name is required.");

  const person = await prisma.alumnus.create({ data: fields });

  revalidatePath("/alumni");
  revalidatePath("/");
  redirect(`/alumni/${person.id}`);
}

export async function updateAlumnus(formData: FormData) {
  await requireEditor();
  const id = String(formData.get("alumnusId") ?? "");
  if (!id) throw new Error("Missing alumnus id.");

  const fields = alumnusFieldsFrom(formData);
  if (!fields.firstName) throw new Error("A first name is required.");

  await prisma.alumnus.update({ where: { id }, data: fields });

  revalidatePath("/alumni");
  revalidatePath(`/alumni/${id}`);
  redirect(`/alumni/${id}`);
}
