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
import {
  createLearningLogAction,
  updateLearningLogAction,
} from "@/features/learning/actions";
import { LEARNING_CATEGORY_LABELS } from "@/features/learning/presentation";
import {
  LEARNING_CATEGORY_VALUES,
  type LearningCategoryValue,
} from "@/features/learning/schemas";
import { TECHNOLOGY_OPTIONS } from "@/features/technologies/constants";

interface LearningLogFormProps {
  defaultStudiedAt: string;
  learningLog?: {
    id: string;
    title: string;
    content: string;
    studiedAt: string;
    studyMinutes: number;
    category: LearningCategoryValue;
    technologyNames: string[];
  };
}

export function LearningLogForm({
  defaultStudiedAt,
  learningLog,
}: LearningLogFormProps) {
  const action = learningLog
    ? updateLearningLogAction.bind(null, learningLog.id)
    : createLearningLogAction;
  const [state, formAction, pending] = useActionState(action, {});
  const technologyError = state.fieldErrors?.technologyNames?.[0];
  const studyHours = learningLog
    ? Math.floor(learningLog.studyMinutes / 60)
    : 0;
  const studyMinutesPart = learningLog ? learningLog.studyMinutes % 60 : 30;

  return (
    <form action={formAction}>
      <Card className="overflow-hidden">
        <CardHeader className="border-b border-border">
          <CardTitle>
            {learningLog ? "학습 기록 수정" : "학습 기록"}
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-6 pt-5 sm:pt-6">
          <div className="grid gap-5 sm:grid-cols-2">
            <Input
              defaultValue={learningLog?.studiedAt ?? defaultStudiedAt}
              error={state.fieldErrors?.studiedAt?.[0]}
              id="studiedAt"
              label="학습 날짜"
              name="studiedAt"
              required
              type="date"
            />
            <Select
              defaultValue={learningLog?.category ?? "OTHER"}
              error={state.fieldErrors?.category?.[0]}
              id="category"
              label="카테고리"
              name="category"
              required
            >
              {LEARNING_CATEGORY_VALUES.map((category) => (
                <option key={category} value={category}>
                  {LEARNING_CATEGORY_LABELS[category]}
                </option>
              ))}
            </Select>
          </div>

          <Input
            autoComplete="off"
            defaultValue={learningLog?.title}
            error={state.fieldErrors?.title?.[0]}
            id="learning-title"
            label="학습 제목"
            maxLength={150}
            name="title"
            placeholder="예: Next.js Server Action 학습"
            required
          />

          <Textarea
            defaultValue={learningLog?.content}
            error={state.fieldErrors?.content?.[0]}
            id="learning-content"
            label="학습 내용"
            maxLength={10000}
            name="content"
            placeholder="배운 내용과 새롭게 알게 된 점을 기록해 주세요."
            required
            rows={8}
          />

          <fieldset>
            <legend className="text-sm font-semibold text-foreground">
              학습 시간
            </legend>
            <p className="mt-1.5 text-xs leading-5 text-muted">
              실제로 학습한 시간을 시간과 분으로 입력해 주세요.
            </p>
            <div className="mt-3 grid gap-5 sm:grid-cols-2">
              <Input
                defaultValue={studyHours}
                error={state.fieldErrors?.studyHours?.[0]}
                id="studyHours"
                label="시간"
                max={24}
                min={0}
                name="studyHours"
                required
                type="number"
              />
              <Input
                defaultValue={studyMinutesPart}
                error={state.fieldErrors?.studyMinutesPart?.[0]}
                id="studyMinutesPart"
                label="분"
                max={59}
                min={0}
                name="studyMinutesPart"
                required
                type="number"
              />
            </div>
          </fieldset>

          <fieldset
            aria-describedby={
              technologyError ? "learning-technologyNames-error" : undefined
            }
          >
            <legend className="text-sm font-semibold text-foreground">
              기술 스택
            </legend>
            <p className="mt-1.5 text-xs leading-5 text-muted">
              이번 학습과 관련된 기술을 선택해 주세요.
            </p>
            <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {TECHNOLOGY_OPTIONS.map((technology) => (
                <label
                  key={technology}
                  className="flex min-h-11 cursor-pointer items-center gap-3 rounded-control border border-input bg-card px-3.5 py-2.5 text-sm font-medium text-foreground hover:bg-surface-subtle has-[:checked]:border-primary has-[:checked]:bg-primary-soft"
                >
                  <input
                    className="size-4 accent-primary"
                    defaultChecked={learningLog?.technologyNames.includes(
                      technology,
                    )}
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
                id="learning-technologyNames-error"
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
          <ButtonLink
            href={learningLog ? `/learning/${learningLog.id}` : "/learning"}
            variant="outline"
          >
            취소
          </ButtonLink>
          <Button loading={pending} loadingLabel="저장 중" type="submit">
            {learningLog ? "변경사항 저장" : "학습 기록 저장"}
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
}
