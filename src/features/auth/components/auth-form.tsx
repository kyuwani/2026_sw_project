"use client";

import { GitBranch } from "lucide-react";
import Link from "next/link";
import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  signInAction,
  signInWithGitHubAction,
  signUpAction,
} from "@/features/auth/actions";

interface AuthFormProps {
  mode: "login" | "signup";
  githubEnabled: boolean;
}

export function AuthForm({ mode, githubEnabled }: AuthFormProps) {
  const isSignUp = mode === "signup";
  const [state, formAction, pending] = useActionState(
    isSignUp ? signUpAction : signInAction,
    {},
  );

  return (
    <div>
      <div className="mb-8 space-y-2">
        <h1 className="text-2xl font-bold text-foreground">
          {isSignUp ? "DevLog 시작하기" : "다시 만나 반가워요"}
        </h1>
        <p className="text-sm leading-6 text-muted">
          {isSignUp
            ? "계정을 만들고 개발 기록을 시작하세요."
            : "계정에 로그인해 작업을 이어가세요."}
        </p>
      </div>

      {githubEnabled ? (
        <>
          <form action={signInWithGitHubAction}>
            <Button
              className="w-full"
              size="lg"
              type="submit"
              variant="outline"
            >
              <GitBranch aria-hidden="true" className="size-4" />
              GitHub로 계속하기
            </Button>
          </form>
          <div className="my-6 flex items-center gap-3 text-xs text-muted">
            <span className="h-px flex-1 bg-border" />
            또는 이메일로 계속하기
            <span className="h-px flex-1 bg-border" />
          </div>
        </>
      ) : null}

      <form action={formAction} className="space-y-5">
        {isSignUp ? (
          <Input
            autoComplete="name"
            error={state.fieldErrors?.name?.[0]}
            id="name"
            label="이름"
            maxLength={50}
            name="name"
            required
          />
        ) : null}

        <Input
          autoComplete="email"
          error={state.fieldErrors?.email?.[0]}
          id="email"
          label="이메일"
          name="email"
          required
          type="email"
        />

        <Input
          autoComplete={isSignUp ? "new-password" : "current-password"}
          description={isSignUp ? "12자 이상, 영문과 숫자를 포함해 주세요." : undefined}
          error={state.fieldErrors?.password?.[0]}
          id="password"
          label="비밀번호"
          maxLength={72}
          minLength={isSignUp ? 12 : undefined}
          name="password"
          required
          type="password"
        />

        {isSignUp ? (
          <Input
            autoComplete="new-password"
            error={state.fieldErrors?.confirmPassword?.[0]}
            id="confirmPassword"
            label="비밀번호 확인"
            maxLength={72}
            minLength={12}
            name="confirmPassword"
            required
            type="password"
          />
        ) : null}

        {state.message ? (
          <p
            aria-live="polite"
            className="rounded-control border border-destructive/30 bg-destructive-soft px-3.5 py-3 text-sm text-destructive"
            role="alert"
          >
            {state.message}
          </p>
        ) : null}

        <Button className="w-full" loading={pending} size="lg" type="submit">
          {isSignUp ? "계정 만들기" : "로그인"}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-muted">
        {isSignUp ? "이미 계정이 있나요?" : "처음 오셨나요?"}{" "}
        <Link
          className="font-semibold text-primary hover:text-primary-hover"
          href={isSignUp ? "/login" : "/signup"}
        >
          {isSignUp ? "로그인" : "회원가입"}
        </Link>
      </p>
    </div>
  );
}