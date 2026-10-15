import { z } from "zod";

const deploymentTargetSchema = z.enum(["preview", "production"]);
const databaseUrlSchema = z
  .url()
  .refine(
    (value) => value.startsWith("postgresql://") || value.startsWith("postgres://"),
    "PostgreSQL 연결 문자열이어야 합니다.",
  )
  .refine((value) => {
    try {
      const hostname = new URL(value).hostname;
      return !["localhost", "127.0.0.1", "::1"].includes(hostname);
    } catch {
      return false;
    }
  }, "배포 환경에서는 로컬 데이터베이스를 사용할 수 없습니다.");

const deploymentEnvSchema = z.object({
  DATABASE_URL: databaseUrlSchema,
  DIRECT_URL: databaseUrlSchema,
  AUTH_SECRET: z.string().min(32),
  AUTH_GITHUB_ID: z.string().trim().min(1),
  AUTH_GITHUB_SECRET: z.string().trim().min(1),
});

const targetResult = deploymentTargetSchema.safeParse(process.argv[2]);
const envResult = deploymentEnvSchema.safeParse(process.env);

if (!targetResult.success || !envResult.success) {
  const invalidFields = [
    ...(targetResult.success ? [] : ["target(preview|production)"]),
    ...(envResult.success
      ? []
      : envResult.error.issues.map((issue) => issue.path.join("."))),
  ];

  throw new Error(
    `배포 환경변수 검증에 실패했습니다: ${[...new Set(invalidFields)].join(", ")}`,
  );
}

console.log(`${targetResult.data} 배포 환경변수 구성이 유효합니다.`);
