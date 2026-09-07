<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# CCF Social Media Dashboard

Read `STATUS.md` in the project root before starting work. It records what is built, what is
not, the decisions already made, and the version-specific traps in this stack that will
otherwise cost you an hour.

Two rules worth stating here directly:

- `src/lib/session.ts` is the authorization boundary. `src/proxy.ts` is an optimistic redirect
  and must never be treated as access control.
- This dashboard holds real alumni personal data. Contact fields are gated to Admin and Editor
  by not selecting the columns at all. `npm run verify:gating` proves it; keep it passing.
