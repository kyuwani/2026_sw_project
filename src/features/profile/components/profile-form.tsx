"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
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
import { TECHNOLOGY_OPTIONS } from "@/features/technologies/constants";
import { updateProfileAction } from "../actions";
import type { UpdateProfileActionState } from "../schemas";

interface ProfileFormProps {
  profile: {
    name: string;
    bio: string;
    githubUrl: string;
    timezone: string;
    primaryTechnologies: string[];
  };
}

const initialState: UpdateProfileActionState = {};
const commonTimeZones = [
  "Asia/Seoul",
  "Asia/Tokyo",
  "Asia/Singapore",
  "Europe/London",
  "Europe/Paris",
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "UTC",
];

export function ProfileForm({ profile }: ProfileFormProps) {
  const [state, formAction, pending] = useActionState(
    updateProfileAction,
    initialState,
  );

  return (
    <form action={formAction} className="min-w-0">
      <Card className="min-w-0">
        <CardHeader className="border-b border-border">
          <CardTitle>프로필 정보</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-6 pt-5 sm:pt-6">
          <Input
            autoComplete="name"
            defaultValue={profile.name}
            error={state.fieldErrors?.name?.[0]}
            id="name"
            label="이름"
            maxLength={50}
            name="name"
            required
          />
          <Textarea
            defaultValue={profile.bio}
            description="프로필에 표시할 소개를 500자 이하로 작성해 주세요."
            error={state.fieldErrors?.bio?.[0]}
            id="bio"
            label="자기소개"
            maxLength={500}
            name="bio"
            rows={4}
          />
          <Input
            autoComplete="url"
            defaultValue={profile.githubUrl}
            description="개인 GitHub 프로필의 전체 URL을 입력해 주세요."
            error={state.fieldErrors?.githubUrl?.[0]}
            id="githubUrl"
            label="GitHub 링크"
            maxLength={200}
            name="githubUrl"
            placeholder="https://github.com/username"
            type="url"
          />
          <div>
            <Input
              defaultValue={profile.timezone}
              description="학습 기록 날짜와 Dashboard·Analytics 집계 기준으로 사용합니다."
              error={state.fieldErrors?.timezone?.[0]}
              id="timezone"
              label="시간대"
              list="timezone-options"
              maxLength={100}
              name="timezone"
              placeholder="Asia/Seoul"
              required
            />
            <datalist id="timezone-options">
              {commonTimeZones.map((timeZone) => (
                <option key={timeZone} value={timeZone} />
              ))}
            </datalist>
          </div>

          <fieldset
            className="min-w-0"
            aria-describedby={
              state.fieldErrors?.primaryTechnologies
                ? "primaryTechnologies-error"
                : "primaryTechnologies-description"
            }
          >
            <legend className="text-sm font-semibold text-foreground">
              주 사용 기술
            </legend>
            <p
              className="mt-1.5 text-xs leading-5 text-muted"
              id="primaryTechnologies-description"
            >
              최대 5개를 표시 순서대로 선택해 주세요.
            </p>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              {Array.from({ length: 5 }, (_, index) => (
                <Select
                  defaultValue={profile.primaryTechnologies[index] ?? ""}
                  id={`primaryTechnology-${index}`}
                  key={index}
                  label={`${index + 1}순위`}
                  name="primaryTechnologies"
                >
                  <option value="">선택 안 함</option>
                  {TECHNOLOGY_OPTIONS.map((technology) => (
                    <option key={technology} value={technology}>
                      {technology}
                    </option>
                  ))}
                </Select>
              ))}
            </div>
            {state.fieldErrors?.primaryTechnologies?.[0] ? (
              <p
                className="mt-2 text-xs font-medium text-destructive"
                id="primaryTechnologies-error"
              >
                {state.fieldErrors.primaryTechnologies[0]}
              </p>
            ) : null}
          </fieldset>

          {state.message ? (
            <p
              aria-live="polite"
              className={
                state.success
                  ? "rounded-control border border-success/30 bg-success-soft px-3.5 py-3 text-sm text-success"
                  : "rounded-control border border-destructive/30 bg-destructive-soft px-3.5 py-3 text-sm text-destructive"
              }
              role={state.success ? "status" : "alert"}
            >
              {state.message}
            </p>
          ) : null}
        </CardContent>
        <CardFooter>
          <Button loading={pending} loadingLabel="저장 중" type="submit">
            변경사항 저장
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
}
