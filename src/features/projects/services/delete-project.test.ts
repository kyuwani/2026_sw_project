import { beforeEach, describe, expect, it, vi } from "vitest";

import { prisma } from "@/lib/db/prisma";
import { deleteProject } from "./delete-project";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/db/prisma", () => ({
  prisma: { project: { deleteMany: vi.fn() } },
}));

describe("deleteProject", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("deletes only a project owned by the user", async () => {
    vi.mocked(prisma.project.deleteMany).mockResolvedValue({ count: 1 });

    await expect(
      deleteProject("user-id", "project-id"),
    ).resolves.toBe(true);
    expect(prisma.project.deleteMany).toHaveBeenCalledWith({
      where: { id: "project-id", userId: "user-id" },
    });
  });

  it("reports failure when no owned project was deleted", async () => {
    vi.mocked(prisma.project.deleteMany).mockResolvedValue({ count: 0 });

    await expect(
      deleteProject("other-user", "project-id"),
    ).resolves.toBe(false);
  });
});
