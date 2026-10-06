const FORMULA_PREFIX = /^[=+\-@]/;

export function sanitizeCsvCell(value: string): string {
  const trimmed = value.trim();
  if (FORMULA_PREFIX.test(trimmed)) {
    return `'${trimmed}`;
  }
  return trimmed;
}
