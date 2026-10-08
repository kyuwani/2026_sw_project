import bcrypt from "bcryptjs";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { prisma } from "@/lib/db/prisma";
import {
  EmailAlreadyRegisteredError,
  registerUser,
} from "./register-user";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/db/prisma", () => ({
  prisma: { user: { create: vi.fn() } },
}));

const input = {
  name: "Dev User",
  email: "dev@example.com",
  password: "devlog-password1",
  confirmPassword: "devlog-password1",
};

describe("registerUser", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("stores a bcrypt hash instead of the plain-text password", async () => {
    vi.mocked(prisma.user.create).mockResolvedValue({
      id: "user-id",
      name: input.name,
      email: input.email,
      emailVerified: null,
      image: null,
      passwordHash: "stored-hash",
      timezone: "Asia/Seoul",
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await registerUser(input);

    const createCall = vi.mocked(prisma.user.create).mock.calls[0];
    const passwordHash = createCall?.[0].data.passwordHash;

    expect(passwordHash).not.toBe(input.password);

    if (typeof passwordHash !== "string") {
      throw new Error("Expected a password hash to be stored.");
    }

    await expect(bcrypt.compare(input.password, passwordHash)).resolves.toBe(true);
  });

  it("converts duplicate-email database errors into a safe domain error", async () => {
    vi.mocked(prisma.user.create).mockRejectedValue({ code: "P2002" });

    await expect(registerUser(input)).rejects.toBeInstanceOf(
      EmailAlreadyRegisteredError,
    );
  });
});
