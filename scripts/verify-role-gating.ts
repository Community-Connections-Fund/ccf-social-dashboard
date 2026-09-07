import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

// Proves the claim behind the role-gated contact fields: for a role that may not
// see alumni email addresses, those columns are never asked for. Not hidden in the
// UI — absent from the SQL, so the values never leave the database at all.

const connectionString = process.env.DIRECT_URL ?? process.env.DATABASE_URL;
const captured: string[] = [];

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString }),
  log: [{ emit: "event", level: "query" }],
});

prisma.$on("query", (event: { query: string }) => captured.push(event.query));

// Mirrors src/app/alumni/page.tsx exactly.
async function listAlumni(showContact: boolean) {
  return prisma.alumnus.findMany({
    select: {
      id: true,
      firstName: true,
      lastName: true,
      cohortYear: true,
      currentOrganization: true,
      boardMemberships: true,
      linkedin: true,
      storyCollected: true,
      featuredStatus: true,
      personalEmail: showContact,
      workEmail: showContact,
    },
  });
}

function report(
  label: string,
  sql: string | undefined,
  rows: Array<Record<string, unknown>>,
) {
  if (!sql) throw new Error(`No SQL captured for ${label}`);
  const mentionsEmail = /personalEmail|workEmail/i.test(sql);
  const rowHasEmailKeys = rows.some(
    (row) => "personalEmail" in row || "workEmail" in row,
  );
  console.log(`\n--- ${label} ---`);
  console.log(`SQL mentions email columns : ${mentionsEmail ? "YES" : "NO"}`);
  console.log(`Returned rows carry emails : ${rowHasEmailKeys ? "YES" : "NO"}`);
  console.log(`SQL: ${sql.replace(/\s+/g, " ").slice(0, 220)}`);
  return { mentionsEmail, rowHasEmailKeys };
}

async function main() {
  captured.length = 0;
  const adminRows = await listAlumni(true);
  const adminSql = captured.filter((q) => /FROM "public"."Alumnus"/i.test(q)).pop();
  const admin = report("ADMIN / EDITOR (allowed to see contact details)", adminSql, adminRows);

  captured.length = 0;
  const reviewerRows = await listAlumni(false);
  const reviewerSql = captured.filter((q) => /FROM "public"."Alumnus"/i.test(q)).pop();
  const reviewer = report("REVIEWER / VIEWER (not allowed)", reviewerSql, reviewerRows);

  const passed =
    admin.mentionsEmail &&
    !reviewer.mentionsEmail &&
    !reviewer.rowHasEmailKeys;

  console.log(
    `\nRESULT: ${passed ? "PASS — a Reviewer's query never requests the email columns." : "FAIL — email data is reachable by a role that should not see it."}`,
  );

  await prisma.$disconnect();
  process.exitCode = passed ? 0 : 1;

}

main();
