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

export type ServerEnv = z.infer<typeof serverEnvSchema>;

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
