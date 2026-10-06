# FOM — progress log

Last updated: 2026-10-06 (production sprint)

## Milestones

| ID | Milestone | Status |
|----|-----------|--------|
| M1–M3 | Scaffold, schema, libs | DONE |
| M4 | Gmail OAuth multi-account + callback | DONE |
| M5 | Lead import CSV/TSV/TXT/ZIP + UI wizard | DONE |
| M6 | Campaign wizard + launch + enrollments | DONE |
| M7 | MIME send + queue cron worker | DONE |
| M8 | Pub/Sub reply sync | NEXT |
| M9 | Tracking open pixel | DONE (minimal) |
| M10 | AI personalization | PENDING |
| M11 | Inbox Gmail sync | PARTIAL (DB list) |
| M12 | Analytics dashboard | DONE (DB aggregates) |
| M13 | Full SR UI | DONE (core pages) |
| M14 | Tests + Vercel deploy | DONE (unit + build on CI) |

## Vercel

- `vercel.json` cron → `/api/cron/process-queue`
- Env checklist in README + `.env.example`

## Next

- Gmail Pub/Sub watch, unified inbox compose
- RLS on Supabase
- Playwright E2E
