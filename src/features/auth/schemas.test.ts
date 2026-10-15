import { describe, expect, it } from "vitest";

import { signInSchema, signUpSchema } from "./schemas";

describe("authentication schemas", () => {
  it("normalizes email addresses for sign in", () => {
    const result = signInSchema.safeParse({
      email: "  DEV@example.com  ",
      password: "correct-password",
    });

    expect(result.success).toBe(true);

    if (result.success) {
      expect(result.data.email).toBe("dev@example.com");
    }
  });

  it("accepts a valid account and trims the display name", () => {
    const result = signUpSchema.safeParse({
      name: "  Dev User  ",
      email: "DEV@example.com",
      password: "devlog-password1",
      confirmPassword: "devlog-password1",
    });

    expect(result.success).toBe(true);

    if (result.success) {
      expect(result.data.name).toBe("Dev User");
      expect(result.data.email).toBe("dev@example.com");
    }
  });

  it("rejects passwords that do not meet the minimum policy", () => {
    const result = signUpSchema.safeParse({
      name: "Dev User",
      email: "dev@example.com",
      password: "short1",
      confirmPassword: "short1",
    });

    expect(result.success).toBe(false);
  });

  it("rejects mismatched confirmation and bcrypt-overlong passwords", () => {
    const mismatch = signUpSchema.safeParse({
      name: "Dev User",
      email: "dev@example.com",
      password: "devlog-password1",
      confirmPassword: "different-password1",
    });
    const overlong = signUpSchema.safeParse({
      name: "Dev User",
      email: "dev@example.com",
      password: `${"a".repeat(72)}12`,
      confirmPassword: `${"a".repeat(72)}12`,
    });

    expect(mismatch.success).toBe(false);
    expect(overlong.success).toBe(false);
  });
});