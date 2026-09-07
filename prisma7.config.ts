import "dotenv/config";
import { defineConfig } from "prisma/config";

// The CLI (migrate, generate, seed) talks to Postgres directly: schema changes are
// statements a transaction-mode pooler cannot run. The application itself uses the
// pooled DATABASE_URL — see src/lib/prisma.ts — because Vercel's serverless
// functions would otherwise exhaust the database's connection slots.
const cliConnectionString = process.env.DIRECT_URL ?? process.env.DATABASE_URL;

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    url: cliConnectionString,
  },
});
