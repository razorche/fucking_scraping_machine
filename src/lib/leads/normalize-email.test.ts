import { describe, expect, it } from "vitest";
import { normalizeEmail, normalizeEmailForDedupe } from "./normalize-email";

describe("normalizeEmail", () => {
  it("trims and lowercases", () => {
    expect(normalizeEmail("  Test@Example.COM ")).toBe("test@example.com");
  });
});

describe("normalizeEmailForDedupe", () => {
  it("strips gmail dots and plus tags", () => {
    expect(normalizeEmailForDedupe("john.doe+news@gmail.com")).toBe("johndoe@gmail.com");
  });

  it("leaves non-gmail addresses normalized only", () => {
    expect(normalizeEmailForDedupe("User@Acme.Co")).toBe("user@acme.co");
  });
});
