/** Least-privilege Gmail scopes for FOM. */
export const GMAIL_SEND_SCOPE = "https://www.googleapis.com/auth/gmail.send";

export const GMAIL_READ_MODIFY_SCOPE =
  "https://www.googleapis.com/auth/gmail.readonly";

export const GMAIL_MODIFY_SCOPE = "https://www.googleapis.com/auth/gmail.modify";

export const DEFAULT_GMAIL_SCOPES = [GMAIL_SEND_SCOPE] as const;

export const GMAIL_SCOPES_WITH_REPLIES = [
  GMAIL_SEND_SCOPE,
  GMAIL_MODIFY_SCOPE,
] as const;
