import path from "node:path";

/** Reject ZIP entries that escape the extraction root (zip slip). */
export function isSafeArchiveEntry(entryName: string): boolean {
  const normalized = entryName.replace(/\\/g, "/");
  if (normalized.startsWith("/") || normalized.includes("..")) {
    return false;
  }
  const resolved = path.posix.normalize(normalized);
  return !resolved.startsWith("..") && !path.posix.isAbsolute(resolved);
}
