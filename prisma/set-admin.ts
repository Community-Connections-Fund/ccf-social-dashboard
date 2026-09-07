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

  // Reuse the seeded admin record if it is still the untouched placeholder, so we
  // move that account rather than leaving an orphan that can still sign in.
  const seeded = existingAdmins.find((user) => user.authId === null);

  if (seeded) {
    await prisma.user.update({
      where: { id: seeded.id },
      data: { email, name },
    });
    console.log(`Admin account moved from ${seeded.email} to ${email}.`);
  } else {
    await prisma.user.create({ data: { email, name, role: "ADMIN" } });
    console.log(`Added ${email} as an admin.`);
  }
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
