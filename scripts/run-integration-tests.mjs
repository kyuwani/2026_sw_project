import { spawn } from "node:child_process";

import nextEnv from "@next/env";

const { loadEnvConfig } = nextEnv;

loadEnvConfig(process.cwd());

if (!process.env.DATABASE_URL) {
  console.error(
    "통합 테스트를 실행하려면 DATABASE_URL 환경 변수가 필요합니다.",
  );
  process.exit(1);
}

const testProcess = spawn(
  process.execPath,
  [
    "node_modules/vitest/vitest.mjs",
    "run",
    "integration.test.ts",
    "--no-file-parallelism",
  ],
  {
    env: { ...process.env, RUN_DB_TESTS: "1" },
    stdio: "inherit",
  },
);

testProcess.on("exit", (code) => {
  process.exit(code ?? 1);
});
