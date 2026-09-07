import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

// Empties every table. Used once before the real alumni archive is imported, so
// no placeholder or test records end up mixed in with real people.
//
//   npm run db:check    what is in there now, deletes nothing
//   npm run db:wipe     delete the content, keeping staff logins and pillars
//   npm run db:reset    delete everything, then load the starter content
//
// db:wipe deliberately keeps the User table. Clearing it would delete the staff
// record behind your own login, and since a Supabase account grants nothing
// without one, that locks you out of a live site. It also keeps content pillars,
// which are CCF's real taxonomy rather than test data.
//
// Deleting is opt-in: running this with no arguments only reports. A tool that
// erases a nonprofit's alumni archive should not do so because someone hit the
// wrong arrow key in their shell history.

const connectionString = process.env.DIRECT_URL ?? process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("Set DATABASE_URL and DIRECT_URL in .env first.");
}

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });

// Children before parents: rows point at each other, and Postgres rejects a
// delete that would orphan something.
//
// Each entry wraps its own calls rather than holding the Prisma model itself.
// The models are different types, and a list of them is a union TypeScript
// cannot call a shared method on.
const CONTENT = [
  {
    name: "Approval events",
    count: () => prisma.approvalEvent.count(),
    clear: () => prisma.approvalEvent.deleteMany(),
  },
  {
    name: "Posts",
    count: () => prisma.post.count(),
    clear: () => prisma.post.deleteMany(),
  },
  {
    name: "Content bank entries",
    count: () => prisma.contentBankEntry.count(),
    clear: () => prisma.contentBankEntry.deleteMany(),
  },
  {
    name: "Alumni",
    count: () => prisma.alumnus.count(),
    clear: () => prisma.alumnus.deleteMany(),
  },
  {
    name: "Asset links",
    count: () => prisma.assetLink.count(),
    clear: () => prisma.assetLink.deleteMany(),
  },
  {
    name: "Analytics snapshots",
    count: () => prisma.analyticsSnapshot.count(),
    clear: () => prisma.analyticsSnapshot.deleteMany(),
  },
];

// Only cleared with --all: your login and CCF's content pillars live here.
const ACCOUNTS_AND_TAXONOMY = [
  {
    name: "Content pillars",
    count: () => prisma.contentPillar.count(),
    clear: () => prisma.contentPillar.deleteMany(),
  },
  {
    name: "Users (logins)",
    count: () => prisma.user.count(),
    clear: () => prisma.user.deleteMany(),
  },
];

async function main() {
  const confirmed = process.argv.includes("--confirm");
  const everything = process.argv.includes("--all");
  const ALL = [...CONTENT, ...ACCOUNTS_AND_TAXONOMY];
  // Always report every table, so "what is in there" is never a partial answer.
  // Only what gets deleted depends on --all.
  const TABLES = confirmed && !everything ? CONTENT : ALL;
  const toDelete = everything ? ALL : CONTENT;

  const counts = await Promise.all(
    TABLES.map(async (table) => ({
      name: table.name,
      count: await table.count(),
    })),
  );

  const total = counts.reduce((sum, row) => sum + row.count, 0);

  console.log(confirmed ? "Deleting:" : "Currently in the database:");
  for (const row of counts) {
    console.log(`  ${row.name.padEnd(24)} ${row.count}`);
  }

  if (!confirmed) {
    console.log(
      `
${total} rows total. Nothing was deleted.
Run "npm run db:wipe" to clear content but keep your login, or "npm run db:reset" to start completely fresh.`,
    );
    return;
  }

  for (const table of toDelete) {
    await table.clear();
  }

  console.log(`\nDeleted ${total} rows. The database is empty.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
