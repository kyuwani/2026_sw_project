import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { AuthForm } from "@/features/auth/components/auth-form";
import { getAuthEnv } from "@/lib/env/server";

export const metadata: Metadata = { title: "회원가입" };

export default async function SignupPage() {
  const session = await auth();

  if (session?.user) {
    redirect("/dashboard");
  }

  const githubEnabled = Boolean(getAuthEnv().AUTH_GITHUB_ID);

  return <AuthForm githubEnabled={githubEnabled} mode="signup" />;
}