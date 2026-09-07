"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { ASSET_CATEGORIES, type AssetCategory, type Role } from "@/lib/workflow";

function text(formData: FormData, key: string): string | null {
  const value = formData.get(key);
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
}

async function requireEditor() {
  const user = await getCurrentUser();
  if ((user.role as Role) === "VIEWER") {
    throw new Error("Your role cannot change the asset library.");
  }
  return user;
}

export async function addAsset(formData: FormData) {
  await requireEditor();

  const title = text(formData, "title");
  const url = text(formData, "url");
  const rawCategory = text(formData, "category") ?? "";

  if (!title || !url) throw new Error("A name and a link are both required.");

  const category = (ASSET_CATEGORIES as readonly string[]).includes(rawCategory)
    ? (rawCategory as AssetCategory)
    : "OTHER";

  await prisma.assetLink.create({
    data: { title, url, category, notes: text(formData, "notes") },
  });

  revalidatePath("/assets");
}

export async function updateAsset(formData: FormData) {
  await requireEditor();
  const id = String(formData.get("assetId") ?? "");
  if (!id) throw new Error("Missing asset id.");

  const title = text(formData, "title");
  const url = text(formData, "url");
  const rawCategory = text(formData, "category") ?? "";

  if (!title || !url) throw new Error("A name and a link are both required.");

  await prisma.assetLink.update({
    where: { id },
    data: {
      title,
      url,
      category: (ASSET_CATEGORIES as readonly string[]).includes(rawCategory)
        ? (rawCategory as AssetCategory)
        : "OTHER",
      notes: text(formData, "notes"),
    },
  });

  revalidatePath("/assets");
}

export async function deleteAsset(formData: FormData) {
  await requireEditor();
  const id = String(formData.get("assetId") ?? "");
  if (!id) throw new Error("Missing asset id.");

  // Deleting the link does not touch the file in Drive, only the pointer to it.
  await prisma.assetLink.delete({ where: { id } });

  revalidatePath("/assets");
}
