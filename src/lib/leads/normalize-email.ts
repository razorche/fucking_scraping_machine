export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function normalizeEmailForDedupe(email: string): string {
  const normalized = normalizeEmail(email);
  const [local, domain] = normalized.split("@");
  if (!local || !domain) return normalized;
  if (domain === "gmail.com" || domain === "googlemail.com") {
    const plusStripped = local.split("+")[0] ?? local;
    return `${plusStripped.replace(/\./g, "")}@gmail.com`;
  }
  return normalized;
}
