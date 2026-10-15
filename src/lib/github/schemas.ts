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

function hasMatchingRepositoryIdentity(
  fullName: string,
  htmlUrl: string,
): boolean {
  try {
    const path = decodeURIComponent(new URL(htmlUrl).pathname.replace(/^\//, ""));
    return path === fullName;
  } catch {
    return false;
  }
}

const githubLoginSchema = z
  .string()
  .regex(/^[A-Za-z0-9](?:[A-Za-z0-9-]{0,38})$/);
const githubRepositoryNameSchema = z
  .string()
  .regex(/^[A-Za-z0-9._-]+$/);

const githubRepositoryOwnerSchema = z.object({
  login: githubLoginSchema,
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

export const githubRepositoryResponseSchema = z
  .object({
    id: z.number().int().nonnegative().safe(),
    name: githubRepositoryNameSchema,
    full_name: z.string().min(3),
    private: z.boolean(),
    html_url: z.string().refine(isGitHubUrl),
    description: z.string().max(10_000).nullable(),
    fork: z.boolean(),
    archived: z.boolean(),
    language: z.string().max(100).nullable(),
    default_branch: z.string().min(1).max(255),
    updated_at: z.iso.datetime({ offset: true }),
    pushed_at: z.iso.datetime({ offset: true }).nullable(),
    owner: githubRepositoryOwnerSchema,
    permissions: githubRepositoryPermissionsSchema,
  })
  .superRefine((repository, context) => {
    const expectedFullName = `${repository.owner.login}/${repository.name}`;
    if (
      repository.full_name !== expectedFullName ||
      !hasMatchingRepositoryIdentity(expectedFullName, repository.html_url)
    ) {
      context.addIssue({
        code: "custom",
        message: "Repository 식별 정보가 일치하지 않습니다.",
      });
    }
  });

export const githubRepositoryListResponseSchema = z
  .array(githubRepositoryResponseSchema)
  .max(100);

export type GitHubRepositoryResponse = z.infer<
  typeof githubRepositoryResponseSchema
>;

export const githubCommitListResponseSchema = z.array(
  z.object({
    sha: z.string().regex(/^[a-f0-9]{7,64}$/i),
    html_url: z.string().refine(isGitHubUrl),
    commit: z.object({
      message: z.string().min(1).max(100_000),
      author: z
        .object({
          name: z.string().min(1),
          date: z.iso.datetime({ offset: true }),
        })
        .nullable(),
    }),
    author: githubRepositoryOwnerSchema.nullable(),
  }),
).max(5);

export type GitHubCommitResponse = z.infer<
  typeof githubCommitListResponseSchema
>[number];
