import "server-only";

import bcrypt from "bcryptjs";

import type { SignUpInput } from "@/features/auth/schemas";
import { prisma } from "@/lib/db/prisma";

export class EmailAlreadyRegisteredError extends Error {
  constructor() {
    super("해당 이메일로 계정을 만들 수 없습니다. 입력값을 확인해 주세요.");
    this.name = "EmailAlreadyRegisteredError";
  }
}

function isUniqueConstraintError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "P2002"
  );
}

export async function registerUser(input: SignUpInput): Promise<void> {
  const passwordHash = await bcrypt.hash(input.password, 12);

  try {
    await prisma.user.create({
      data: {
        name: input.name,
        email: input.email,
        passwordHash,
      },
    });
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      throw new EmailAlreadyRegisteredError();
    }

    throw error;
  }
}