import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  signInAction,
  signInWithGitHubAction,
  signUpAction,
} from "./actions";
import { registerUser } from "./services/register-user";

const authMocks = vi.hoisted(() => ({
  signIn: vi.fn(),
  signOut: vi.fn(),
}));
const nextAuthMocks = vi.hoisted(() => ({
  AuthError: class AuthError extends Error {},
}));

vi.mock("@/auth", () => authMocks);
vi.mock("next-auth", () => nextAuthMocks);
vi.mock("./services/register-user", () => ({
  EmailAlreadyRegisteredError: class extends Error {},
  registerUser: vi.fn(),
}));

function createSignInFormData(): FormData {
  const formData = new FormData();
  formData.set("email", "  USER@Example.com ");
  formData.set("password", "correct-password1");
  return formData;
}

function createSignUpFormData(): FormData {
  const formData = new FormData();
  formData.set("name", "개발자");
  formData.set("email", "  USER@Example.com ");
  formData.set("password", "correct-password1");
  formData.set("confirmPassword", "correct-password1");
  return formData;
}

describe("authentication actions", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("rejects invalid sign-in input before calling Auth.js", async () => {
    const formData = createSignInFormData();
    formData.set("email", "invalid-email");

    const result = await signInAction({}, formData);

    expect(result.fieldErrors?.email).toBeDefined();
    expect(authMocks.signIn).not.toHaveBeenCalled();
  });

  it("normalizes credentials and ignores a forged user ID", async () => {
    const formData = createSignInFormData();
    formData.set("userId", "forged-user-id");

    await expect(signInAction({}, formData)).resolves.toEqual({});
    expect(authMocks.signIn).toHaveBeenCalledWith("credentials", {
      email: "user@example.com",
      password: "correct-password1",
      redirectTo: "/dashboard",
    });
  });

  it("returns the same safe message for an Auth.js sign-in failure", async () => {
    authMocks.signIn.mockRejectedValue(
      new nextAuthMocks.AuthError("internal auth detail"),
    );

    await expect(signInAction({}, createSignInFormData())).resolves.toEqual({
      message: "이메일 또는 비밀번호를 확인해 주세요.",
    });
  });

  it("registers only validated fields and signs in the new user", async () => {
    const formData = createSignUpFormData();
    formData.set("userId", "forged-user-id");

    await expect(signUpAction({}, formData)).resolves.toEqual({});
    expect(registerUser).toHaveBeenCalledWith({
      name: "개발자",
      email: "user@example.com",
      password: "correct-password1",
      confirmPassword: "correct-password1",
    });
    expect(authMocks.signIn).toHaveBeenCalledWith("credentials", {
      email: "user@example.com",
      password: "correct-password1",
      redirectTo: "/dashboard",
    });
  });

  it("starts GitHub authentication without accepting client identity data", async () => {
    await signInWithGitHubAction();

    expect(authMocks.signIn).toHaveBeenCalledWith("github", {
      redirectTo: "/dashboard",
    });
  });
});
