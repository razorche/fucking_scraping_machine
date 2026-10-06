# FOM — progress log

Last updated: 2026-10-06

## Milestones

| ID | Milestone | Status | Notes |
|----|-----------|--------|-------|
| M1 | Next.js scaffold, Tailwind FOM palette (no purple), base UI | DONE | Pass 0001–0005 |
| M2 | Prisma schema (workspace, leads, campaigns, queue, tracking) | DONE | Pass 0006–0010 |
| M3 | Domain libs: env, crypto vault, email normalize, AI Zod schema | DONE | Pass 0011–0014 |
| M4 | Gmail OAuth + account health UI | IN PROGRESS | `/api/auth/google` redirect stub; callback Pass 0018 |
| M5 | Lead import CSV/TSV/TXT/ZIP | IN PROGRESS | Delimited parser + ZIP slip guard |
| M6 | Campaign & sequence engine | PENDING | |
| M7 | MIME send + queue worker | PENDING | |
| M8 | Pub/Sub reply reconciliation | PENDING | |
| M9 | Tracking pixel & click redirect | PENDING | |
| M10 | AI personalization & reply classification | PENDING | |
| M11 | Unified inbox | PENDING | |
| M12 | Analytics & DNS diagnostics | PENDING | |
| M13 | Full SR UI + motion | IN PROGRESS | Shell + nav done |
| M14 | Vitest / Playwright / production build | IN PROGRESS | Vitest baseline |

## Domain passes (snapshot)

- **0001–0005**: Repo init, strict TS, Serbian `lang=sr`, sidebar shell, electric-blue/cyan/lime tokens.
- **0006–0010**: `prisma/schema.prisma` — tenants, Gmail accounts, leads, campaigns, sequences, queue, sends, tracking, replies, audit.
- **0011–0014**: Token encryption (AES-256-GCM), lead normalization, CSV injection guard, Gmail scope constants, AI output Zod schema.

## Verification (latest)

See `docs/verification.md`.

## Next actions

1. Wire `DATABASE_URL` and run `npx prisma migrate dev`.
2. Implement Google OAuth routes + encrypted token persistence.
3. Lead import pipeline with ZIP safe extraction.
