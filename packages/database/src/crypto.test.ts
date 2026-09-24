import { describe, it, expect, beforeAll } from "vitest";
import { encryptSecret, decryptSecret } from "./crypto";

beforeAll(() => {
  process.env.ENCRYPTION_KEY = "test-only-encryption-key-do-not-use-in-prod";
});

describe("encryptSecret / decryptSecret", () => {
  it("round-trips a secret", () => {
    const plaintext = "rzp_live_test_secret_value";
    const encrypted = encryptSecret(plaintext);
    expect(encrypted).not.toBe(plaintext);
    expect(decryptSecret(encrypted)).toBe(plaintext);
  });

  it("produces a different ciphertext each time (random IV)", () => {
    const a = encryptSecret("same-input");
    const b = encryptSecret("same-input");
    expect(a).not.toBe(b);
    expect(decryptSecret(a)).toBe("same-input");
    expect(decryptSecret(b)).toBe("same-input");
  });

  it("throws when the payload has been tampered with", () => {
    const encrypted = encryptSecret("sensitive-value");
    const [iv, authTag, data] = encrypted.split(":");
    const tampered = [iv, authTag, data.slice(0, -2) + "00"].join(":");
    expect(() => decryptSecret(tampered)).toThrow();
  });

  it("throws on a malformed payload", () => {
    expect(() => decryptSecret("not-a-valid-payload")).toThrow();
  });
});
