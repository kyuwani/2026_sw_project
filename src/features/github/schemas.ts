import { z } from "zod";

export const externalRepositoryIdSchema = z
  .string()
  .regex(/^\d+$/, "올바른 Repository를 선택해 주세요.")
  .transform(Number)
  .refine(Number.isSafeInteger, "올바른 Repository를 선택해 주세요.");

export interface RepositoryConnectionActionState {
  success?: boolean;
  message?: string;
}
