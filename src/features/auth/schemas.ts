import { z } from "zod";

const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .pipe(z.email({ error: "올바른 이메일 주소를 입력해 주세요." }));

export const signInSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "비밀번호를 입력해 주세요."),
});

export const signUpSchema = z
  .object({
    name: z.string().trim().min(2, "이름은 두 글자 이상 입력해 주세요.").max(50),
    email: emailSchema,
    password: z
      .string()
      .min(12, "비밀번호는 12자 이상 입력해 주세요.")
      .regex(/[A-Za-z]/, "영문자를 하나 이상 포함해 주세요.")
      .regex(/[0-9]/, "숫자를 하나 이상 포함해 주세요.")
      .refine(
        (value) => new TextEncoder().encode(value).byteLength <= 72,
        "비밀번호는 UTF-8 기준 72바이트 이하여야 합니다.",
      ),
    confirmPassword: z.string(),
  })
  .refine((values) => values.password === values.confirmPassword, {
    message: "비밀번호가 일치하지 않습니다.",
    path: ["confirmPassword"],
  });

export type SignUpInput = z.infer<typeof signUpSchema>;
export type AuthField = "name" | "email" | "password" | "confirmPassword";

export interface AuthActionState {
  message?: string;
  fieldErrors?: Partial<Record<AuthField, string[]>>;
}