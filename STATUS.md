# CCF Social Media Dashboard — where things stand

Last updated: 7 September 2026

A social media command centre for Community Connections Fund: content calendar,
approval workflow, alumni archive, content bank, asset links, analytics.

It replaces a planned Notion + Canva + Buffer + Zapier stack. The point is that CCF
owns it outright and pays nothing per month, so **avoid adding paid services** — that
was the whole reason for building it.

---

## Running it

```bash
npm run dev          # http://localhost:3000
```

Sign in with the address in `ADMIN_EMAIL` (`.env`) and the password set for that
account in Supabase → Authentication → Users.

`.env` is gitignored and holds the database password and Supabase keys. It is never
committed and must not be pasted into a chat.

| Command | Does |
| --- | --- |
| `npm run dev` | Dev server |
| `npm run build` | Production build — **run before deploying**, it catches things dev mode hides |
| `npm run db:check` | Report row counts. Deletes nothing. |
| `npm run db:wipe` | Empty every table |
| `npm run db:reset` | Empty, then reload starter content |
| `npm run set-admin` | Point the admin record at `ADMIN_EMAIL` |
| `npm run verify:gating` | Prove alumni emails are not queried for roles that may not see them |

---

## Stack

- **Next.js 16.3** (App Router) — note this version renamed Middleware to **Proxy**
- **Prisma 7** + **Supabase Postgres**
- **Supabase Auth** for passwords; roles live in our own `User` table
- **Tailwind v4**
- Deploy target: **Vercel** (not yet done)

---

## Done

- Content calendar: month and week grid, platform filter, status colours, unscheduled rail
- Posts: create, edit, delete, detail page with a preview of how the post will read
- Approval pipeline: Idea → Draft → Needs review → Approved → Scheduled → Published, with an
  `ApprovalEvent` audit row per transition. Approving is Admin/Reviewer only.
- Content bank: search, pillar filter, create/edit/delete, "Use in calendar" prefills a post
- Alumni: table matching the real archive columns, search, create/edit, detail page
- **CSV importer** with a preview before writing. Matches on LinkedIn, falls back to name +
  cohort, skips blank cells so an import cannot erase hand-entered data, and never touches
  the dashboard's own tracking fields. Verified end to end.
- **Auth**: staff logins, four roles, admin-only staff management page
- Alumni email addresses are visible only to Admin and Editor, enforced by not selecting the
  columns at all — verified by `npm run verify:gating`

## Not done

1. **Deploy to Vercel.** Accounts exist. Needs env vars set in Vercel and a first deploy.
2. **Real alumni archive import.** Run `npm run db:wipe` first so no placeholder records mix
   in with real people. Source sheet has: First name, Last name, Organization, Personal email,
   Work email, Board memberships, LinkedIn, Cohort year.
3. Asset Library and Analytics display data but have no add/edit forms yet.
4. Alumni edits are not audit-logged the way post approvals are.
5. Adding staff is two steps: add on the Staff page, then create the login in Supabase with
   the same email. Collapsing this into one step needs the Supabase `service_role` key, which
   is a deliberate decision not yet taken.
6. AI caption drafting — roughly a session's work, needs an Anthropic API key.
7. Auto-posting — blocked on Meta app review and LinkedIn partner access, i.e. weeks of
   waiting on other companies. Not a coding problem.

---

## Where the important logic lives

| Concern | File |
| --- | --- |
| **Who is the user — the authorization boundary** | `src/lib/session.ts` |
| Allowed roles, statuses, platforms, permission rules | `src/lib/workflow.ts` |
| Optimistic redirect only, **not** a security control | `src/proxy.ts` |
| UTC-safe date handling for the calendar | `src/lib/dates.ts` |
| CSV parsing, name splitting, match keys | `src/lib/alumni-import.ts` |

`src/lib/workflow.ts` is the single source of truth for statuses, platforms and roles. They
are stored as plain strings rather than database enums so changing one is a code change, not
a migration.

---

## Things that will waste your time if you do not know them

- **After any schema change, restart the dev server.** It caches the generated Prisma client,
  and you get `Unknown argument` errors that look like bad code. Stopping the npm task may
  leave the `next dev` child alive — check the port and kill the PID directly.
- **Next.js 16 bundles its own docs** at `node_modules/next/dist/docs/`. This version differs
  from most training data; read them rather than guessing. Middleware is `proxy.ts` now.
- **Prisma 7 puts the datasource URL in `prisma7.config.ts`**, not in `schema.prisma`. Its
  config datasource accepts only `url` and `shadowDatabaseUrl` — `directUrl` is not valid
  there, despite some docs showing it.
- **`prisma migrate dev` is interactive** and fails in an automated shell. Use
  `prisma migrate diff --from-migrations ... --to-schema ... --script` to write the migration,
  then `prisma migrate deploy`.
- **Postgres `contains` is case-sensitive.** Search filters need `mode: "insensitive"`. This
  silently broke search when moving off SQLite.
- **Prisma queries are not `fetch`**, so Next cannot tell a page is dynamic. Any page reading
  the database needs `export const dynamic = "force-dynamic"` or it gets prerendered at build
  time and shows numbers that never change.
- **The project lives in OneDrive.** `node_modules` sync churn causes `EPERM` warnings during
  npm installs; they are usually harmless. The SQLite file is gone, but keep in mind anything
  written into this folder syncs to Microsoft.

---

## Decisions already made — do not silently reverse them

- **Alumni contact details are role-gated to Admin and Editor.** Chosen deliberately over
  leaving contact info out entirely, because the spotlight workflow needs it.
- **No self-signup.** A Supabase account grants nothing unless an admin created a matching
  staff record.
- **The Google Sheet stays the system of record for alumni.** Free-tier Supabase has thin
  backup retention; the dashboard is where the work happens, not the only copy.
- **Statuses and roles are strings, not database enums** — see above.
- **Publish dates are calendar dates stored at UTC midnight** and formatted in UTC everywhere,
  so a Thursday post never renders on Wednesday.
