import "dotenv/config";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "../src/generated/prisma/client";

const prisma = new PrismaClient({
  adapter: new PrismaBetterSqlite3({
    url: process.env.DATABASE_URL ?? "file:./dev.db",
  }),
});

const PILLARS = [
  "Meet Our Alumni",
  "Leadership Quotes",
  "Applications Are Open (Recruitment)",
  "Throwback Thursday",
  "Alumni Call-Outs",
  "Why We Exist",
  "Program Stories",
  "Community Partners",
];

async function main() {
  const pillars = new Map<string, string>();
  for (const [index, name] of PILLARS.entries()) {
    const pillar = await prisma.contentPillar.upsert({
      where: { name },
      update: { sortOrder: index },
      create: { name, sortOrder: index },
    });
    pillars.set(name, pillar.id);
  }

  const charles = await prisma.user.upsert({
    where: { email: "charles@everyoneeq.com" },
    update: {},
    create: {
      id: "seed-user-charles",
      name: "Charles Yang",
      email: "charles@everyoneeq.com",
      role: "ADMIN",
    },
  });

  const alumni = [
    {
      id: "seed-alum-jane-doe",
      name: "Jane Doe",
      cohortYear: 2025,
      currentOrganization: "Google",
      currentRole: "CMO",
      linkedin: "JANEDOE.linkdin.com",
    },
    {
      id: "seed-alum-john-smith",
      name: "John Smith",
      cohortYear: 2024,
      currentOrganization: "Amazon",
      currentRole: "Driver",
      linkedin: "JOHNSMITH.linkdin.com",
    },
  ];

  for (const record of alumni) {
    await prisma.alumnus.upsert({
      where: { id: record.id },
      update: {},
      create: record,
    });
  }

  const bankEntries = [
    {
      id: "seed-bank-applications-open",
      idea: "Applications are Open",
      pillar: "Applications Are Open (Recruitment)",
      lastPosted: new Date("2026-07-22"),
    },
    {
      id: "seed-bank-why-we-exist",
      idea: "Why we exist",
      pillar: "Why We Exist",
      lastPosted: new Date("2026-07-22"),
    },
  ];

  for (const entry of bankEntries) {
    await prisma.contentBankEntry.upsert({
      where: { id: entry.id },
      update: {},
      create: {
        id: entry.id,
        idea: entry.idea,
        evergreen: true,
        graphicNeeded: true,
        lastPosted: entry.lastPosted,
        contentPillarId: pillars.get(entry.pillar),
      },
    });
  }

  const posts = [
    {
      id: "seed-post-alumni-spotlight",
      title: "Alumni Spotlight",
      status: "IDEA",
      platform: "INSTAGRAM",
      caption: "Jane Doe",
      graphicStatus: "IN_PROGRESS",
      publishDate: new Date("2026-07-22"),
      pillar: "Meet Our Alumni",
      ownerId: charles.id,
      alumnusId: "seed-alum-jane-doe",
    },
    {
      id: "seed-post-leadership-thought",
      title: "Leadership Thought",
      status: "IDEA",
      platform: "LINKEDIN",
      graphicStatus: "IN_PROGRESS",
      publishDate: new Date("2026-07-24"),
      pillar: "Leadership Quotes",
      ownerId: charles.id,
    },
    {
      id: "seed-post-recruitment",
      title: "Recruitment",
      status: "IDEA",
      platform: "INSTAGRAM",
      graphicStatus: "IN_PROGRESS",
      publishDate: new Date("2026-07-27"),
      pillar: "Applications Are Open (Recruitment)",
      ownerId: charles.id,
    },
    {
      id: "seed-post-throwback-thursday-scheduled",
      title: "Throwback Thursday",
      status: "IDEA",
      platform: "INSTAGRAM",
      graphicStatus: "IN_PROGRESS",
      publishDate: new Date("2026-07-30"),
      pillar: "Throwback Thursday",
      ownerId: charles.id,
    },
    {
      id: "seed-post-leadership-quote",
      title: "Leadership Quote",
      status: "APPROVED",
      pillar: "Leadership Quotes",
    },
    {
      id: "seed-post-meet-our-alumni",
      title: "Meet Our Alumni",
      status: "IDEA",
      pillar: "Meet Our Alumni",
    },
    {
      id: "seed-post-applications-are-open",
      title: "Applications Are Open",
      status: "DRAFT",
      pillar: "Applications Are Open (Recruitment)",
      bankEntryId: "seed-bank-applications-open",
    },
    {
      id: "seed-post-throwback-thursday",
      title: "Throwback Thursday",
      status: "IDEA",
      pillar: "Throwback Thursday",
    },
    {
      id: "seed-post-alumni-update-request",
      title: "Alumni Update Request",
      status: "DRAFT",
      pillar: "Alumni Call-Outs",
    },
  ];

  for (const post of posts) {
    const { pillar, ...rest } = post;
    await prisma.post.upsert({
      where: { id: post.id },
      update: {},
      create: { ...rest, contentPillarId: pillars.get(pillar) },
    });
  }

  console.log(
    `Seeded ${PILLARS.length} pillars, ${alumni.length} alumni, ${bankEntries.length} content bank entries, ${posts.length} posts.`,
  );
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
