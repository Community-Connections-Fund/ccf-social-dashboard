-- Close the database's own front door.
--
-- Supabase exposes every table in the `public` schema through PostgREST, reachable
-- by anyone holding the publishable key — a key that is designed to be public.
-- Supabase's security model assumes Row Level Security is what protects the rows.
-- We never enabled it, so the default grants let an outsider read the alumni table,
-- personal email addresses included, without ever touching this application.
--
-- Enabling RLS with no policies denies everything to the `anon` and `authenticated`
-- roles. The app is unaffected: Prisma connects as `postgres`, which owns these
-- tables, and a table owner bypasses RLS unless FORCE is also set.
--
-- If a policy is ever needed here, note that this app does its authorization in
-- src/lib/session.ts, not in the database. Policies would be a second, redundant
-- mechanism — prefer keeping the deny-all posture.

ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Post" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Alumnus" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ContentPillar" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ContentBankEntry" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ApprovalEvent" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "AssetLink" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "AnalyticsSnapshot" ENABLE ROW LEVEL SECURITY;

-- Prisma's own bookkeeping table is equally exposed and equally uninteresting to
-- anyone but this app.
ALTER TABLE "_prisma_migrations" ENABLE ROW LEVEL SECURITY;
