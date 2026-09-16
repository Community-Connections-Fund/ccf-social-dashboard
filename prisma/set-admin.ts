import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

// Points the existing administrator record at whatever ADMIN_EMAIL says.
//
//   npm run set-admin
//
// Reads the address from .env rather than taking it as an argument, so it never
// has to be typed into a chat window or a shell history.

const connectionString = process.env.DIRECT_URL ?? process.env.DATABASE_URL;
if (!connectionString) throw new Error("Set DATABASE_URL and DIRECT_URL in .env.");

const email = (process.env.ADMIN_EMAIL ?? "").trim().toLowerCase();
if (!email || email.startsWith("PUT_YOUR")) {
  throw new Error("Set ADMIN_EMAIL in .env to your login address first.");
}

const name = process.env.ADMIN_NAME?.trim() || "Administrator";
const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });

async function main() {
  const existingAdmins = await prisma.user.findMany({ where: { role: "ADMIN" } });
  const alreadyCorrect = existingAdmins.find((user) => user.email === email);

  if (alreadyCorrect) {
    console.log(`${email} is already an admin. Nothing to change.`);
    return;
  }

  // Move an existing admin rather than adding a second one, so the old address
  // cannot still sign in. Prefer an unclaimed record; otherwise move the sole
  // admin, which is the case when changing the address the dashboard is owned by.
  const target =
    existingAdmins.find((user) => user.authId === null) ??
    (existingAdmins.length === 1 ? existingAdmins[0] : null);

  if (!target) {
    await prisma.user.create({ data: { email, name, role: "ADMIN" } });
    console.log(`Added ${email} as an admin.`);
    return;
  }

  // authId must be cleared along with the address. It binds this record to one
  // Supabase account, and signing in from a different one is refused outright
  // rather than rebound — so moving the email without clearing it would leave an
  // admin record nobody on earth can sign into, with no way to undo it from the
  // app. This is the step that turns an email change into a locked-out charity.
  await prisma.user.update({
    where: { id: target.id },
    data: { email, name, authId: null },
  });

  console.log(
    `Admin account moved from ${target.email} to ${email}.\n` +
      `Create a Supabase user for ${email} — it will be linked on first sign-in.\n` +
      `${target.email} can no longer sign in.`,
  );
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
