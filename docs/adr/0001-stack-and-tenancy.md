# ADR 0001: Stack and multi-tenant model

## Status

Accepted — 2026-10-06

## Context

FOM is a production B2B outreach SaaS requiring Gmail API integration, durable queues, and strict tenant isolation.

## Decision

- **Frontend**: Next.js App Router, TypeScript strict, Tailwind v4, Radix primitives, Serbian (Latin) UI copy.
- **Backend**: Route handlers + server modules in the same repo; PostgreSQL via Prisma.
- **Tenancy**: `Workspace` is the isolation boundary; all leads, accounts, campaigns, and suppressions are scoped by `workspaceId`. RLS on Supabase will mirror these boundaries in a later pass.
- **Secrets**: OAuth tokens stored as AES-256-GCM blobs (`encryptedTokens` + `tokenKeyId`), never logged.

## Consequences

- Single deployable unit with clear module boundaries under `src/lib` and `src/domain`.
- Migrations are the source of truth for schema; client generated via `prisma generate`.
