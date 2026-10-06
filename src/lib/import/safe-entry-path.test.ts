import { describe, expect, it } from "vitest";
import { isSafeArchiveEntry } from "./safe-entry-path";

describe("isSafeArchiveEntry", () => {
  it("allows normal relative paths", () => {
    expect(isSafeArchiveEntry("states/TX/leads.txt")).toBe(true);
  });

  it("rejects path traversal", () => {
    expect(isSafeArchiveEntry("../../etc/passwd")).toBe(false);
    expect(isSafeArchiveEntry("states/../../../secret")).toBe(false);
  });

  it("rejects absolute paths", () => {
    expect(isSafeArchiveEntry("/tmp/evil.txt")).toBe(false);
  });
});
