import { z } from "zod";

import { TECHNOLOGY_OPTIONS } from "@/features/technologies/constants";
import { isValidTimeZone } from "@/lib/date/time-zone";

const optionalText = (maxLength: number, message: string) =>
  z.preprocess(
    (value) =>
      typeof value === "string" && value.trim() === "" ? undefined : value,
    z.string().trim().max(maxLength, message).optional(),
  );

const githubProfileUrlSchema = z.preprocess(
  (value) =>
    typeof value === "string" && value.trim() === "" ? undefined : value,
  z
    .string()
    .trim()
    .max(200, "GitHub 링크는 200자 이하로 입력해 주세요.")
    .regex(
      /^https:\/\/github\.com\/[A-Za-z0-9](?:[A-Za-z0-9-]{0,38})\/?$/,
      "GitHub 프로필 URL 형식으로 입력해 주세요.",
    )
    .optional(),
);

export const updateProfileSchema = z.object({
  name: z
    .string({ error: "이름을 입력해 주세요." })
    .trim()
    .min(1, "이름을 입력해 주세요.")
    .max(50, "이름은 50자 이하로 입력해 주세요."),
  bio: optionalText(500, "자기소개는 500자 이하로 입력해 주세요."),
  githubUrl: githubProfileUrlSchema,
  timezone: z
    .string({ error: "시간대를 입력해 주세요." })
    .trim()
    .min(1, "시간대를 입력해 주세요.")
    .max(100, "시간대는 100자 이하로 입력해 주세요.")
    .refine(isValidTimeZone, "올바른 IANA 시간대를 입력해 주세요."),
  primaryTechnologies: z
    .array(z.enum(TECHNOLOGY_OPTIONS))
    .max(5, "주 사용 기술은 최대 5개까지 선택할 수 있습니다.")
    .refine(
      (technologies) => new Set(technologies).size === technologies.length,
      "동일한 기술을 중복해서 선택할 수 없습니다.",
    ),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type ProfileField =
  | "name"
  | "bio"
  | "githubUrl"
  | "timezone"
  | "primaryTechnologies";

export interface UpdateProfileActionState {
  success?: boolean;
  message?: string;
  fieldErrors?: Partial<Record<ProfileField, string[]>>;
}
