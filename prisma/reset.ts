import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

// Empties every table. Used once before the real alumni archive is imported, so
// no placeholder or test records end up mixed in with real people.
//
//   npm run db:check    what is in there now, deletes nothing
//   npm run db:wipe     delete everything
//   npm run db:reset    delete everything, then load the starter content
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
const TABLES = [
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
    name: "Content pillars",
    count: () => prisma.contentPillar.count(),
    clear: () => prisma.contentPillar.deleteMany(),
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
  {
    name: "Users",
    count: () => prisma.user.count(),
    clear: () => prisma.user.deleteMany(),
  },
];

async function main() {
  const confirmed = process.argv.includes("--confirm");

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
      `\n${total} rows total. Nothing was deleted.\nRun "npm run db:wipe" to empty it, or "npm run db:reset" to empty it and reload the starter content.`,
    );
    return;
  }

  for (const table of TABLES) {
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
