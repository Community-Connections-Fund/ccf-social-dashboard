"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { ROLES, type Role } from "@/lib/workflow";

// Managing who can get in, and at what level, is an admin-only power.
async function requireAdmin() {
  const user = await getCurrentUser();
  if ((user.role as Role) !== "ADMIN") {
    throw new Error("Only an admin can manage staff.");
  }
  return user;
}

function roleFrom(formData: FormData): Role {
  const value = String(formData.get("role") ?? "");
  return (ROLES as readonly string[]).includes(value)
    ? (value as Role)
    : "VIEWER";
}

export async function addStaff(formData: FormData) {
  await requireAdmin();

  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();

  if (!name || !email) throw new Error("Name and email are both required.");

  await prisma.user.create({ data: { name, email, role: roleFrom(formData) } });

  revalidatePath("/staff");
}

export async function updateStaffRole(formData: FormData) {
  const admin = await requireAdmin();
  const id = String(formData.get("userId") ?? "");
  const role = roleFrom(formData);

  // Guarding only against demoting *yourself* leaves the organisation one click
  // from having no administrator: two admins can demote each other, and nobody
  // can then reach this page to fix it. Count instead.
  if (role !== "ADMIN") {
    const target = await prisma.user.findUnique({ where: { id } });
    if (target?.role === "ADMIN") {
      const admins = await prisma.user.count({ where: { role: "ADMIN" } });
      if (admins <= 1) {
        throw new Error(
          "That is the only administrator. Promote someone else first.",
        );
      }
    }
  }

  if (id === admin.id && role !== "ADMIN") {
    throw new Error("You cannot remove your own admin role.");
  }

  await prisma.user.update({ where: { id }, data: { role } });
  revalidatePath("/staff");
}

export async function removeStaff(formData: FormData) {
  const admin = await requireAdmin();
  const id = String(formData.get("userId") ?? "");

  if (id === admin.id) {
    throw new Error("You cannot remove yourself.");
  }

  const target = await prisma.user.findUnique({ where: { id } });
  if (target?.role === "ADMIN") {
    const admins = await prisma.user.count({ where: { role: "ADMIN" } });
    if (admins <= 1) {
      throw new Error("That is the only administrator and cannot be removed.");
    }
  }

  // Posts and approval history point at this person. Detach rather than delete,
  // so removing someone does not erase the record of what they approved.
  await prisma.$transaction([
    prisma.post.updateMany({ where: { ownerId: id }, data: { ownerId: null } }),
    prisma.approvalEvent.updateMany({
      where: { actorId: id },
      data: { actorId: null },
    }),
    prisma.user.delete({ where: { id } }),
  ]);

  revalidatePath("/staff");
}
