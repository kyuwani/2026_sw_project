"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { ButtonLink } from "@/components/ui/button-link";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { createProjectAction } from "@/features/projects/actions";
import { PROJECT_TECHNOLOGY_OPTIONS } from "@/features/projects/schemas";

export function ProjectForm() {
  const [state, formAction, pending] = useActionState(createProjectAction, {});
  const technologyError = state.fieldErrors?.technologyNames?.[0];

  return (
    <form action={formAction}>
      <Card className="overflow-hidden">
        <CardHeader className="border-b border-border">
          <CardTitle>기본 정보</CardTitle>
        </CardHeader>

        <CardContent className="grid gap-6 pt-5 sm:pt-6">
          <Input
            autoComplete="off"
            error={state.fieldErrors?.title?.[0]}
            id="title"
            label="프로젝트 이름"
            maxLength={100}
            name="title"
            placeholder="예: DevLog"
            required
          />

          <Textarea
            error={state.fieldErrors?.description?.[0]}
            id="description"
            label="설명"
            maxLength={2000}
            name="description"
            placeholder="프로젝트의 목표와 주요 내용을 적어 주세요."
            rows={5}
          />

          <Select
            defaultValue="PLANNING"
            error={state.fieldErrors?.status?.[0]}
            id="status"
            label="상태"
            name="status"
            required
          >
            <option value="PLANNING">계획</option>
            <option value="IN_PROGRESS">진행 중</option>
            <option value="COMPLETED">완료</option>
            <option value="ARCHIVED">보관</option>
          </Select>

          <div className="grid gap-5 sm:grid-cols-2">
            <Input
              error={state.fieldErrors?.startDate?.[0]}
              id="startDate"
              label="시작일"
              name="startDate"
              type="date"
            />
            <Input
              error={state.fieldErrors?.endDate?.[0]}
              id="endDate"
              label="종료일"
              name="endDate"
              type="date"
            />
          </div>

          <Input
            description="GitHub 저장소를 연결할 경우 전체 URL을 입력해 주세요."
            error={state.fieldErrors?.repositoryUrl?.[0]}
            id="repositoryUrl"
            label="GitHub Repository"
            maxLength={500}
            name="repositoryUrl"
            placeholder="https://github.com/owner/repository"
            type="url"
          />

          <fieldset
            aria-describedby={technologyError ? "technologyNames-error" : undefined}
          >
            <legend className="text-sm font-semibold text-foreground">기술 스택</legend>
            <p className="mt-1.5 text-xs leading-5 text-muted">
              프로젝트에서 사용할 기술을 선택해 주세요. 나중에 변경할 수 있습니다.
            </p>

            <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {PROJECT_TECHNOLOGY_OPTIONS.map((technology) => (
                <label
                  key={technology}
                  className="flex min-h-11 cursor-pointer items-center gap-3 rounded-control border border-input bg-card px-3.5 py-2.5 text-sm font-medium text-foreground hover:bg-surface-subtle has-[:checked]:border-primary has-[:checked]:bg-primary-soft"
                >
                  <input
                    className="size-4 accent-primary"
                    name="technologyNames"
                    type="checkbox"
                    value={technology}
                  />
                  {technology}
                </label>
              ))}
            </div>

            {technologyError ? (
              <p
                className="mt-2 text-xs font-medium text-destructive"
                id="technologyNames-error"
              >
                {technologyError}
              </p>
            ) : null}
          </fieldset>

          {state.message ? (
            <p
              aria-live="polite"
              className="rounded-control border border-destructive/30 bg-destructive-soft px-3.5 py-3 text-sm text-destructive"
              role="alert"
            >
              {state.message}
            </p>
          ) : null}
        </CardContent>

        <CardFooter>
          <ButtonLink href="/projects" variant="outline">
            취소
          </ButtonLink>
          <Button loading={pending} loadingLabel="저장 중" type="submit">
            프로젝트 만들기
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
}
