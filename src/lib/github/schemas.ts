import { z } from "zod";

function isHttpsUrl(value: string): boolean {
  try {
    return new URL(value).protocol === "https:";
  } catch {
    return false;
  }
}

function isGitHubUrl(value: string): boolean {
  if (!isHttpsUrl(value)) return false;
  return new URL(value).hostname === "github.com";
}

const githubRepositoryOwnerSchema = z.object({
  login: z.string().min(1),
  avatar_url: z.string().refine(isHttpsUrl).nullable().optional(),
});

const githubRepositoryPermissionsSchema = z
  .object({
    admin: z.boolean().optional(),
    maintain: z.boolean().optional(),
    push: z.boolean().optional(),
    triage: z.boolean().optional(),
    pull: z.boolean().optional(),
  })
  .optional();

export const githubRepositoryResponseSchema = z.object({
  id: z.number().int().nonnegative(),
  name: z.string().min(1),
  full_name: z.string().min(3),
  private: z.boolean(),
  html_url: z.string().refine(isGitHubUrl),
  description: z.string().nullable(),
  fork: z.boolean(),
  archived: z.boolean(),
  language: z.string().nullable(),
  default_branch: z.string().min(1),
  updated_at: z.iso.datetime({ offset: true }),
  pushed_at: z.iso.datetime({ offset: true }).nullable(),
  owner: githubRepositoryOwnerSchema,
  permissions: githubRepositoryPermissionsSchema,
});

export const githubRepositoryListResponseSchema = z.array(
  githubRepositoryResponseSchema,
);

export type GitHubRepositoryResponse = z.infer<
  typeof githubRepositoryResponseSchema
>;
