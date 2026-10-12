import { beforeEach, describe, expect, it, vi } from "vitest";

import { getProfile } from "./queries";

const prismaMocks = vi.hoisted(() => ({ userFindUnique: vi.fn() }));

vi.mock("server-only", () => ({}));
vi.mock("@/lib/db/prisma", () => ({
  prisma: { user: { findUnique: prismaMocks.userFindUnique } },
}));

describe("getProfile", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns a safe profile DTO and ordered technologies", async () => {
    prismaMocks.userFindUnique.mockResolvedValue({
      id: "user-id",
      name: "개발자",
      email: "developer@example.com",
      bio: "소개",
      githubUrl: "https://github.com/octocat",
      timezone: "Asia/Seoul",
      image: "https://avatars.githubusercontent.com/u/1?v=4",
      accounts: [{ id: "account-id" }],
      primaryTechnologies: [
        { technology: { name: "TypeScript" } },
        { technology: { name: "Next.js" } },
      ],
    });

    await expect(getProfile("user-id")).resolves.toEqual({
      id: "user-id",
      name: "개발자",
      email: "developer@example.com",
      bio: "소개",
      githubUrl: "https://github.com/octocat",
      timezone: "Asia/Seoul",
      imageUrl: "https://avatars.githubusercontent.com/u/1?v=4",
      primaryTechnologies: ["TypeScript", "Next.js"],
      githubConnected: true,
    });
  });

  it("does not expose profile images from an unapproved host", async () => {
    prismaMocks.userFindUnique.mockResolvedValue({
      id: "user-id",
      name: null,
      email: null,
      bio: null,
      githubUrl: null,
      timezone: "Asia/Seoul",
      image: "https://example.com/avatar.png",
      accounts: [],
      primaryTechnologies: [],
    });

    const profile = await getProfile("user-id");

    expect(profile?.imageUrl).toBeNull();
    expect(profile?.githubConnected).toBe(false);
  });
});
