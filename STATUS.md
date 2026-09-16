# CCF Social Media Dashboard — where things stand

Last updated: 7 September 2026 · **Live and deployed**

A social media command centre for Community Connections Fund: content calendar,
approval workflow, alumni archive, content bank, asset links, analytics.

It replaces a planned Notion + Canva + Buffer + Zapier stack. CCF owns it outright and
pays nothing per month, so **avoid adding paid services** — that was the entire point.

---

## The three places this lives

| What | Where | Notes |
| --- | --- | --- |
| **Live site** | https://ccf-social-dashboard.vercel.app | Requires sign-in |
| **Code** | github.com/Community-Connections-Fund/ccf-social-dashboard | Private, org-owned |
| **Database + logins** | Supabase project `qrpxdaybquillgqwoqnj` | Postgres 17, us-east-1 |
| **Hosting** | Vercel, team "CCF", Hobby (free) | Deploys `main` automatically |

Admin login: **info@communitycxn.org** (password lives in Supabase → Authentication → Users).

The GitHub repo is owned by the **organisation**, not a person, so CCF keeps the code
regardless of staff turnover. The Vercel and Supabase accounts use the org email for the
same reason — keep it that way.

---

## How to change the site

```
edit code  →  git commit  →  git push  →  Vercel rebuilds and deploys (~2 min)
```

There is nothing to click in Vercel. It only needs visiting to change environment
variables.

```bash
npm run dev          # local, http://localhost:3000
```

| Command | Does |
| --- | --- |
| `npm run dev` | Local dev server |
| `npm run build` | Production build — **run before pushing**, it catches what dev mode hides |
| `npm run db:check` | Report row counts. Deletes nothing. |
| `npm run db:wipe` | Clear content. **Keeps your login and content pillars.** |
| `npm run db:reset` | Clear everything, then reload starter content |
| `npm run set-admin` | Point the admin record at whatever `ADMIN_EMAIL` says |
| `npm run verify:gating` | Prove alumni emails are never queried for roles that may not see them |

`.env` holds the database password and Supabase keys. Gitignored, never committed, never
to be pasted into a chat window. The same six values are set in Vercel → Settings →
Environment Variables; **changing one means changing it in both places.**

---

## Built and working

- **Content calendar** — month grid, week view, platform filter, status colours, a rail for
  undated posts, opens on a month that has posts rather than an empty one
- **Posts** — create, edit, delete, detail page with a preview of how the post will read
- **Approval workflow** — Idea → Draft → Needs review → Approved → Scheduled → Published,
  every transition writing an audit row. Approving is Admin/Reviewer only.
- **Content bank** — search across ideas, captions and notes, pillar filter, create/edit/
  delete, and "Use in calendar" which opens a new post prefilled from the entry
- **Alumni** — the real archive columns, search, create/edit, detail page
- **CSV importer** — previews every change before writing, matches on LinkedIn and falls
  back to name + cohort, skips blank cells so an import cannot erase typed-in data, never
  touches the dashboard's own tracking fields. Verified end to end.
- **Asset library** — add and remove Drive links by category. Removing deletes the pointer,
  never the file in Drive.
- **Analytics** — record followers/reach/engagement/impressions/clicks per platform per
  period; follower growth chart; top-performing posts ranked by engagement
- **Authentication** — staff logins, four roles, admin-only staff management
- **Alumni contact details are visible only to Admin and Editor**, enforced by not selecting
  the columns at all. `npm run verify:gating` proves it.

## Not built yet

1. **Real alumni archive not imported.** Run `npm run db:wipe` first so placeholders do not
   mix with real people. Source sheet columns: First name, Last name, Organization, Personal
   email, Work email, Board memberships, LinkedIn, Cohort year.
2. **AI caption drafting** — agreed design: a button on each post, not automatic. Needs an
   Anthropic API key in `.env` and in Vercel. **Open question: should a draft start from the
   matching Content Bank entry so CCF's voice stays consistent, or be written fresh?**
3. **Generated graphics** — agreed design: the system generates branded cards for the
   repeatable formats (quotes, spotlights, throwbacks) *and* Canva links keep working for
   bespoke designs. Both write the same `graphicUrl` field, so supporting both costs nothing
   extra. Canva's auto-fill API is not needed and is not free.
4. **Automatic scheduling and analytics collection** — blocked on Meta app review and
   LinkedIn partner access. Weeks of waiting on other companies, not a coding problem. The
   columns an automated pull would fill already exist.
5. Adding staff is two steps: add on the Staff page, then create the login in Supabase with
   the same email. One-step creation needs the Supabase `service_role` key — a deliberate
   decision not yet taken.
6. Alumni edits are not audit-logged the way post approvals are.

---

## The automation pipeline, mapped

The proposal's future workflow is not a separate system. Each step is a status transition
that already exists:

| Proposal step | Status change | Automated by |
| --- | --- | --- |
| Content Idea | → `Idea` | a person, or pulled from Content Bank |
| AI Draft | `Idea → Draft` | Claude writes the caption |
| Graphic Created | sets `graphicUrl` | generated card, or a Canva link pasted in |
| **Manager Approval** | `Needs review → Approved` | **a person, deliberately** |
| Automatically Scheduled | `Approved → Scheduled` | blocked on platform API access |
| Analytics Recorded | after `Published` | blocked on the same access |

The valuable half — drafting and graphics — is not blocked. The blocked half saves the
fewest hours.

---

## Security

**Row Level Security is enabled on every table, and must stay enabled.** Supabase exposes
the `public` schema over PostgREST to anyone holding the publishable key — a key designed
to be public. Until 15 September the alumni table, email addresses included, was readable
that way without signing in, bypassing this app entirely. RLS with no policies denies the
`anon` and `authenticated` roles everything; Prisma is unaffected because it connects as
the table owner. Re-probe with a REST call using the publishable key if you ever suspect
regression. **Any new table needs `ALTER TABLE "X" ENABLE ROW LEVEL SECURITY;` in its
migration** — Prisma will not add it for you.

**The Supabase linter's "leaked password protection disabled" warning is knowingly left
open.** That feature is Pro-plan only ($25/month) and blocks users from choosing a password
found in a public breach dump — worth paying for when many people set their own passwords,
not for a handful of accounts. The free equivalent is checking a password at
haveibeenpwned.com/Passwords before using it. Revisit when staff accounts are added, which
is also when Pro's better backup retention starts to matter.

Two adversarial audits were run; both died on usage limits. Their surviving findings, plus
the lenses that never ran, were completed by hand on 15-16 September. **Note:** the second
audit reported 13 findings as "refuted" — that was a bug in the audit script, which counted
a finding with zero surviving verdicts as refuted rather than unverified. Nothing was
actually refuted; they were checked manually instead.

Fixed over the two rounds:

- Seven pages rendered live data without resolving the session, trusting `proxy.ts` alone.
  Every page now calls `getCurrentUser()`.
- `proxy.ts` allowed requests through when the Supabase environment variables were missing.
  One forgotten variable on a deployment would have published the dashboard. It now fails
  closed.
- `updateAlumnus` wrote contact fields unconditionally, so a Reviewer saving an alumni
  record silently erased both email addresses.
- **RLS was off** — the whole database was readable over Supabase's REST API with the
  publishable key. See the RLS note above; this was the worst of them.
- Session cookies lacked `HttpOnly`, so injected script could have lifted a live session.
  Now `HttpOnly`, `Secure` in production, `SameSite=Lax`.
- `proxy.ts` discarded Supabase's cookie writes when redirecting, so an invalidated session
  cookie was never cleared from the browser.
- The identity lookup used `findFirst` with an `OR`, which two rows can satisfy — the same
  person could resolve to different roles on different requests. Now ordered: an existing
  `authId` binding always wins.
- Sign-out was unreachable below 768px, since the sidebar holding it is hidden on mobile.
- **`set-admin` would have locked the charity out.** Changing the admin address left
  `authId` bound to the old Supabase account, and `session.ts` refuses a mismatch rather
  than rebinding — an admin record nobody could sign into, unfixable from the app. It now
  clears `authId` when the address moves.
- The last-admin guards only prevented demoting *yourself*, so two admins could demote each
  other to zero. Both paths now count remaining admins.
- The CSV importer had no size limit; capped at 5MB.

Checked and clean: no `dangerouslySetInnerHTML` anywhere, no raw SQL, no open redirects, no
API route handlers, every Server Action role-guarded, no personal data in logs, no secret in
any commit or in the browser bundle, and of the other Supabase surfaces reachable with the
publishable key, Storage has no buckets while Realtime and the schema dump refuse it.

Verified on the live site: every route redirects a signed-out visitor, HTTP upgrades to
HTTPS, HSTS and the security headers are served.

### Still open

- **Public signup is enabled on the Supabase project** (`disable_signup: false`), which
  contradicts the no-self-signup model. A stranger who signs up still gets nothing without a
  staff row, but it lets anyone fill the auth table and becomes dangerous if email
  auto-confirm is ever switched on. Turn off under Authentication -> Sign In / Providers ->
  Email.
- **The database password needs rotating.** It was surfaced into a chat transcript. Do it
  with the real-data import so there is one disruption: reset in Supabase, update `.env` and
  both Vercel variables, redeploy.
- **Is two-factor enabled on the GitHub account?** Never confirmed. Vercel and Supabase both
  authenticate through it, so that one account is the master key to code, hosting and data.
- `requireEditor()` blocks only VIEWER, so a REVIEWER can create, edit and delete content
  while the Staff page describes them as people who approve posts. Moot with one account.
- An admin can approve a post they drafted. Enforcing separation of duties would block all
  work at current staffing.
- Alumni edits are not audit-logged the way post approvals are.

## Where the important logic lives

| Concern | File |
| --- | --- |
| **Who is the user — the authorization boundary** | `src/lib/session.ts` |
| Roles, statuses, platforms, permission rules | `src/lib/workflow.ts` |
| Optimistic redirect only, **not** a security control | `src/proxy.ts` |
| UTC-safe date handling | `src/lib/dates.ts` |
| CSV parsing, name splitting, match keys | `src/lib/alumni-import.ts` |
| Follower growth chart | `src/components/growth-chart.tsx` |

`src/lib/workflow.ts` is the single source of truth for statuses, platforms and roles,
stored as strings rather than database enums so changing one is a code change, not a
migration.

---

## Things that will waste your time if you do not know them

- **After any schema change, restart the dev server.** It caches the generated Prisma
  client and produces `Unknown argument` errors that look like bad code. Stopping the npm
  task can leave the `next dev` child alive — check the port and kill the PID.
- **Next.js 16 bundles its own docs** at `node_modules/next/dist/docs/`. This version differs
  from most training data. Middleware is `proxy.ts` now.
- **Prisma 7 puts the datasource URL in `prisma7.config.ts`**, not `schema.prisma`, and its
  config datasource accepts only `url` and `shadowDatabaseUrl` — `directUrl` is invalid
  there despite some docs showing it.
- **`prisma migrate dev` is interactive** and fails in an automated shell. Use
  `prisma migrate diff --from-migrations ... --to-schema ... --script`, then `migrate deploy`.
- **Postgres `contains` is case-sensitive.** Search needs `mode: "insensitive"`.
- **Prisma queries are not `fetch`**, so Next cannot tell a page is dynamic. Any page reading
  the database needs `export const dynamic = "force-dynamic"` or it is prerendered at build
  time and its numbers never change.
- **`postinstall` runs `prisma generate`** because the generated client is gitignored and
  Vercel builds from a clean checkout. Do not remove it.
- **The project folder is inside OneDrive.** `node_modules` sync churn causes harmless
  `EPERM` warnings during installs.

---

## Decisions already made — do not silently reverse them

- **Eight content pillars**, keeping the names from the original Notion setup.
- **AI drafting is a button**, not automatic on post creation.
- **Graphics: both.** Generated cards for repeatable formats, Canva for bespoke.
- **Alumni contact details are role-gated to Admin and Editor**, chosen over omitting them,
  because the spotlight workflow needs them.
- **No self-signup.** A Supabase account grants nothing without a staff record an admin made.
- **The Google Sheet stays the system of record for alumni.** Free-tier Supabase has thin
  backup retention; this dashboard is where the work happens, not the only copy.
- **Blank metrics stay null, never zero.** An unmeasured post is not a post that scored zero,
  and zeroes would put false troughs in growth numbers and fiction in the rankings.
- **Publish dates are calendar dates at UTC midnight**, formatted in UTC everywhere, so a
  Thursday post never renders on Wednesday.

---

## Next steps, in order

1. **Import the real alumni archive** — `npm run db:wipe`, then Alumni → Import CSV.
2. **AI caption drafting** — needs the Anthropic key, and an answer on whether drafts should
   start from Content Bank entries.
3. **Generated graphic cards** — needs CCF brand colours and fonts.
4. **Start the Meta developer application** if auto-posting is genuinely wanted, since the
   waiting begins the day you apply.
