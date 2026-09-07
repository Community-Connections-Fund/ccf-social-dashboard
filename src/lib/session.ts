import { prisma } from "@/lib/prisma";

// Single-user stand-in until staff logins are wired up at deployment. Every caller
// already asks "who is acting?", so swapping this for a real session lookup later
// does not change any of the call sites.
export async function getCurrentUser() {
  return prisma.user.findFirstOrThrow({ orderBy: { createdAt: "asc" } });
}
