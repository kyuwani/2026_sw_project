"use server";

import { AuthError } from "next-auth";

import { signIn, signOut } from "@/auth";
import {
  signInSchema,
  signUpSchema,
  type AuthActionState,
} from "@/features/auth/schemas";
import {
  EmailAlreadyRegisteredError,
  registerUser,
} from "@/features/auth/services/register-user";

export async function signInAction(
  _previousState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const parsed = signInSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  try {
    await signIn("credentials", {
      ...parsed.data,
      redirectTo: "/dashboard",
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return { message: "이메일 또는 비밀번호를 확인해 주세요." };
    }

    throw error;
  }

  return {};
}

export async function signUpAction(
  _previousState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const parsed = signUpSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });

  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  try {
    await registerUser(parsed.data);
  } catch (error) {
    if (error instanceof EmailAlreadyRegisteredError) {
      return { message: error.message };
    }

    throw error;
  }

  try {
    await signIn("credentials", {
      email: parsed.data.email,
      password: parsed.data.password,
      redirectTo: "/dashboard",
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return {
        message: "가입을 완료했습니다. 로그인 화면에서 다시 로그인해 주세요.",
      };
    }

    throw error;
  }

  return {};
}

export async function signInWithGitHubAction(): Promise<void> {
  await signIn("github", { redirectTo: "/dashboard" });
}

export async function signOutAction(): Promise<void> {
  await signOut({ redirectTo: "/login" });
}