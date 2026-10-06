import { normalizeEmail } from "@/lib/leads/normalize-email";

export function isValidEmail(email: string): boolean {
  const norm = normalizeEmail(email);
  if (!norm || norm.length > 254) return false;
  const regex =
    /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;
  return regex.test(norm);
}
