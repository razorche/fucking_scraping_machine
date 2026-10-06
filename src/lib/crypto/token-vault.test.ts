import { describe, expect, it } from "vitest";
import { decryptSecret, encryptSecret } from "./token-vault";

describe("token-vault", () => {
  it("round-trips encrypted secrets", () => {
    const key = "test-encryption-key-with-enough-entropy";
    const plain = JSON.stringify({ access_token: "secret", refresh_token: "refresh" });
    const cipher = encryptSecret(plain, key);
    expect(decryptSecret(cipher, key)).toBe(plain);
  });
});
