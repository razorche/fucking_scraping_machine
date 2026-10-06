# FOM verification log

## 2026-10-06 — Production sprint

| Check | Result |
|-------|--------|
| `npm run test` | 7 tests pass |
| `npm run lint` | Pass |
| `npm run typecheck` | Pass |
| `npm run build` | Pass on Vercel (local may EPERM if dev server locks Prisma DLL) |

### Manual smoke (production)

1. `/lidovi` — upload CSV/ZIP, preview, commit
2. `/naloge` — connect 2+ Gmail accounts
3. `/kampanje` — create + launch, verify `SendRecord` in DB
4. `/api/cron/process-queue` — Vercel cron or manual with `CRON_SECRET`
5. `/analitika` — counters update
