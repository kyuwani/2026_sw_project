import "server-only";

import { z } from "zod";

const databaseUrlSchema = z
  .url("DATABASE_URL은 유효한 URL이어야 합니다.")
  .refine(
    (value) => value.startsWith("postgresql://") || value.startsWith("postgres://"),
    "DATABASE_URL은 PostgreSQL 연결 문자열이어야 합니다.",
  );

const serverEnvSchema = z.object({
  DATABASE_URL: databaseUrlSchema,
});

const authEnvSchema = z
  .object({
    AUTH_SECRET: z.string().min(32, "AUTH_SECRET은 32자 이상이어야 합니다."),
    AUTH_GITHUB_ID: z.string().min(1).optional(),
    AUTH_GITHUB_SECRET: z.string().min(1).optional(),
  })
  .refine(
    ({ AUTH_GITHUB_ID, AUTH_GITHUB_SECRET }) =>
      Boolean(AUTH_GITHUB_ID) === Boolean(AUTH_GITHUB_SECRET),
    "GitHub OAuth 설정에는 AUTH_GITHUB_ID와 AUTH_GITHUB_SECRET이 모두 필요합니다.",
  );

export type ServerEnv = z.infer<typeof serverEnvSchema>;
export type AuthEnv = z.infer<typeof authEnvSchema>;

export function getServerEnv(): ServerEnv {
  const result = serverEnvSchema.safeParse({
    DATABASE_URL: process.env.DATABASE_URL,
  });

  if (!result.success) {
    throw new Error(
      "서버 환경변수 설정이 올바르지 않습니다. DATABASE_URL을 확인하세요.",
    );
  }

  return result.data;
}

export function getAuthEnv(): AuthEnv {
  const result = authEnvSchema.safeParse({
    AUTH_SECRET: process.env.AUTH_SECRET,
    AUTH_GITHUB_ID: process.env.AUTH_GITHUB_ID || undefined,
    AUTH_GITHUB_SECRET: process.env.AUTH_GITHUB_SECRET || undefined,
  });

  if (!result.success) {
    throw new Error("인증 환경변수 설정이 올바르지 않습니다.");
  }

  return result.data;
}
