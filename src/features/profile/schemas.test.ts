import { describe, expect, it } from "vitest";

import { updateProfileSchema } from "./schemas";

const validInput = {
  name: "개발자",
  bio: "기록하며 성장합니다.",
  githubUrl: "https://github.com/octocat",
  timezone: "Asia/Seoul",
  primaryTechnologies: ["Next.js", "TypeScript"],
};

describe("updateProfileSchema", () => {
  it("accepts a valid profile", () => {
    expect(updateProfileSchema.safeParse(validInput).success).toBe(true);
  });

  it("rejects invalid IANA time zones and non-profile GitHub URLs", () => {
    expect(
      updateProfileSchema.safeParse({
        ...validInput,
        timezone: "Asia/Invalid",
      }).success,
    ).toBe(false);
    expect(
      updateProfileSchema.safeParse({
        ...validInput,
        githubUrl: "https://example.com/octocat",
      }).success,
    ).toBe(false);
  });

  it("rejects duplicate or unsupported primary technologies", () => {
    expect(
      updateProfileSchema.safeParse({
        ...validInput,
        primaryTechnologies: ["React", "React"],
      }).success,
    ).toBe(false);
    expect(
      updateProfileSchema.safeParse({
        ...validInput,
        primaryTechnologies: ["Unknown"],
      }).success,
    ).toBe(false);
  });
});
