import { afterEach, describe, expect, it, vi } from "vitest";

import { getAuthEnv } from "./server";

vi.mock("server-only", () => ({}));

const validSecret = "test-auth-secret-with-at-least-32-characters";

describe("server authentication environment", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("requires a sufficiently long authentication secret", () => {
    vi.stubEnv("AUTH_SECRET", "");
    vi.stubEnv("AUTH_GITHUB_ID", "");
    vi.stubEnv("AUTH_GITHUB_SECRET", "");

    expect(() => getAuthEnv()).toThrow(
      "인증 환경변수 설정이 올바르지 않습니다.",
    );
  });

  it("rejects a partially configured GitHub OAuth provider", () => {
    vi.stubEnv("AUTH_SECRET", validSecret);
    vi.stubEnv("AUTH_GITHUB_ID", "github-client-id");
    vi.stubEnv("AUTH_GITHUB_SECRET", "");

    expect(() => getAuthEnv()).toThrow(
      "인증 환경변수 설정이 올바르지 않습니다.",
    );
  });

  it("returns validated server-only authentication settings", () => {
    vi.stubEnv("AUTH_SECRET", validSecret);
    vi.stubEnv("AUTH_GITHUB_ID", "github-client-id");
    vi.stubEnv("AUTH_GITHUB_SECRET", "github-client-secret");

    expect(getAuthEnv()).toEqual({
      AUTH_SECRET: validSecret,
      AUTH_GITHUB_ID: "github-client-id",
      AUTH_GITHUB_SECRET: "github-client-secret",
    });
  });
});
