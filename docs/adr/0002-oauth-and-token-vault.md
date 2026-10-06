# ADR 0002: Gmail OAuth and token vault

## Status

Accepted — 2026-10-06

## Context

Gmail sending requires OAuth 2.0 with minimal scopes. Tokens must never appear in logs or client bundles.

## Decision

- Default scope set: `gmail.send` only (`DEFAULT_GMAIL_SCOPES`).
- Optional reply sync adds `gmail.modify` in a separate connect flow (explicit user consent).
- Tokens serialized as JSON and encrypted with AES-256-GCM via `FOM_TOKEN_ENCRYPTION_KEY`.
- Authorization entrypoint: `GET /api/auth/google` (state/PKCE and workspace binding in Pass 0018).

## Consequences

- Callback handler must validate state, exchange code server-side, and persist `encryptedTokens` on `GmailAccount`.
- Health state machine on `GmailAccount.health` drives UI and send gating.
