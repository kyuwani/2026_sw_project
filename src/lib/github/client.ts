import "server-only";

import {
  githubCommitListResponseSchema,
  githubRepositoryListResponseSchema,
  type GitHubCommitResponse,
  type GitHubRepositoryResponse,
} from "./schemas";

const GITHUB_API_URL = "https://api.github.com";
const GITHUB_API_VERSION = "2026-03-10";
const REPOSITORIES_PER_PAGE = 100;
const MAX_REPOSITORY_PAGES = 1;
const RECENT_COMMIT_COUNT = 5;

export interface GitHubRepositoryDto {
  externalId: number;
  name: string;
  fullName: string;
  ownerLogin: string;
  ownerAvatarUrl: string | null;
  htmlUrl: string;
  description: string | null;
  visibility: "PRIVATE" | "PUBLIC";
  permission: "ADMIN" | "WRITE" | "READ";
  language: string | null;
  defaultBranch: string;
  isFork: boolean;
  isArchived: boolean;
  updatedAt: Date;
  pushedAt: Date | null;
}

export interface GitHubRateLimit {
  remaining: number | null;
  resetAt: Date | null;
}

export interface GitHubCommitDto {
  sha: string;
  shortSha: string;
  message: string;
  authorName: string;
  authorLogin: string | null;
  authorAvatarUrl: string | null;
  committedAt: Date | null;
  htmlUrl: string;
}

type GitHubClientFailure = {
  ok: false;
  reason:
    | "REAUTH_REQUIRED"
    | "FORBIDDEN"
    | "RATE_LIMITED"
    | "NETWORK_ERROR"
    | "INVALID_RESPONSE"
    | "API_ERROR";
  retryAt: Date | null;
};

export type GitHubRepositoryClientResult =
  | {
      ok: true;
      repositories: GitHubRepositoryDto[];
      rateLimit: GitHubRateLimit;
      truncated: boolean;
    }
  | GitHubClientFailure;

export type GitHubCommitClientResult =
  | {
      ok: true;
      commits: GitHubCommitDto[];
      rateLimit: GitHubRateLimit;
    }
  | GitHubClientFailure;

interface GitHubClientOptions {
  fetcher?: typeof fetch;
  maxPages?: number;
  now?: () => Date;
}

function parseHeaderInteger(value: string | null): number | null {
  if (!value || !/^\d+$/.test(value)) return null;
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) ? parsed : null;
}

function readRateLimit(headers: Headers): GitHubRateLimit {
  const remaining = parseHeaderInteger(headers.get("x-ratelimit-remaining"));
  const reset = parseHeaderInteger(headers.get("x-ratelimit-reset"));

  return {
    remaining,
    resetAt: reset === null ? null : new Date(reset * 1_000),
  };
}

function getRetryAt(headers: Headers, now: Date): Date | null {
  const retryAfter = parseHeaderInteger(headers.get("retry-after"));
  if (retryAfter !== null) {
    return new Date(now.getTime() + retryAfter * 1_000);
  }
  return readRateLimit(headers).resetAt;
}

function getPermission(
  repository: GitHubRepositoryResponse,
): GitHubRepositoryDto["permission"] {
  if (repository.permissions?.admin) return "ADMIN";
  if (repository.permissions?.maintain || repository.permissions?.push) {
    return "WRITE";
  }
  return "READ";
}

function toRepositoryDto(
  repository: GitHubRepositoryResponse,
): GitHubRepositoryDto {
  return {
    externalId: repository.id,
    name: repository.name,
    fullName: repository.full_name,
    ownerLogin: repository.owner.login,
    ownerAvatarUrl: repository.owner.avatar_url ?? null,
    htmlUrl: repository.html_url,
    description: repository.description,
    visibility: repository.private ? "PRIVATE" : "PUBLIC",
    permission: getPermission(repository),
    language: repository.language,
    defaultBranch: repository.default_branch,
    isFork: repository.fork,
    isArchived: repository.archived,
    updatedAt: new Date(repository.updated_at),
    pushedAt: repository.pushed_at ? new Date(repository.pushed_at) : null,
  };
}

function toCommitDto(commit: GitHubCommitResponse): GitHubCommitDto {
  const message =
    commit.commit.message
      .split("\n")
      .find((line) => line.trim().length > 0)
      ?.trim() ?? "Commit 메시지 없음";

  return {
    sha: commit.sha,
    shortSha: commit.sha.slice(0, 7),
    message: message.length > 120 ? `${message.slice(0, 117)}...` : message,
    authorName: commit.commit.author?.name ?? commit.author?.login ?? "알 수 없음",
    authorLogin: commit.author?.login ?? null,
    authorAvatarUrl: commit.author?.avatar_url ?? null,
    committedAt: commit.commit.author
      ? new Date(commit.commit.author.date)
      : null,
    htmlUrl: commit.html_url,
  };
}

function getRequestHeaders(accessToken: string): HeadersInit {
  return {
    Accept: "application/vnd.github+json",
    Authorization: `Bearer ${accessToken}`,
    "User-Agent": "JandiNote",
    "X-GitHub-Api-Version": GITHUB_API_VERSION,
  };
}

function getResponseFailure(
  response: Response,
  now: Date,
): GitHubClientFailure | null {
  if (response.ok) return null;

  const rateLimit = readRateLimit(response.headers);
  if (response.status === 401) {
    return { ok: false, reason: "REAUTH_REQUIRED", retryAt: null };
  }
  if (
    response.status === 429 ||
    (response.status === 403 &&
      (rateLimit.remaining === 0 || response.headers.has("retry-after")))
  ) {
    return {
      ok: false,
      reason: "RATE_LIMITED",
      retryAt: getRetryAt(response.headers, now),
    };
  }
  if (response.status === 403) {
    return { ok: false, reason: "FORBIDDEN", retryAt: null };
  }
  return { ok: false, reason: "API_ERROR", retryAt: null };
}

export async function listGitHubRepositories(
  accessToken: string,
  options: GitHubClientOptions = {},
): Promise<GitHubRepositoryClientResult> {
  const fetcher = options.fetcher ?? fetch;
  const maxPages = Math.max(1, options.maxPages ?? MAX_REPOSITORY_PAGES);
  const now = options.now ?? (() => new Date());
  const repositories: GitHubRepositoryDto[] = [];
  let rateLimit: GitHubRateLimit = { remaining: null, resetAt: null };

  for (let page = 1; page <= maxPages; page += 1) {
    const url = new URL("/user/repos", GITHUB_API_URL);
    url.searchParams.set("affiliation", "owner,collaborator,organization_member");
    url.searchParams.set("sort", "updated");
    url.searchParams.set("direction", "desc");
    url.searchParams.set("per_page", String(REPOSITORIES_PER_PAGE));
    url.searchParams.set("page", String(page));

    let response: Response;
    try {
      response = await fetcher(url, {
        cache: "no-store",
        headers: getRequestHeaders(accessToken),
        signal: AbortSignal.timeout(10_000),
      });
    } catch {
      return { ok: false, reason: "NETWORK_ERROR", retryAt: null };
    }

    rateLimit = readRateLimit(response.headers);

    const failure = getResponseFailure(response, now());
    if (failure) return failure;

    let body: unknown;
    try {
      body = await response.json();
    } catch {
      return { ok: false, reason: "INVALID_RESPONSE", retryAt: null };
    }

    const parsed = githubRepositoryListResponseSchema.safeParse(body);
    if (!parsed.success) {
      return { ok: false, reason: "INVALID_RESPONSE", retryAt: null };
    }

    repositories.push(...parsed.data.map(toRepositoryDto));

    if (parsed.data.length < REPOSITORIES_PER_PAGE) {
      return { ok: true, repositories, rateLimit, truncated: false };
    }

    if (rateLimit.remaining === 0) {
      return {
        ok: false,
        reason: "RATE_LIMITED",
        retryAt: rateLimit.resetAt,
      };
    }
  }

  return { ok: true, repositories, rateLimit, truncated: true };
}

export async function listGitHubRecentCommits(
  accessToken: string,
  owner: string,
  repository: string,
  options: GitHubClientOptions = {},
): Promise<GitHubCommitClientResult> {
  const fetcher = options.fetcher ?? fetch;
  const now = options.now ?? (() => new Date());
  const url = new URL(
    `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repository)}/commits`,
    GITHUB_API_URL,
  );
  url.searchParams.set("per_page", String(RECENT_COMMIT_COUNT));

  let response: Response;
  try {
    response = await fetcher(url, {
      cache: "no-store",
      headers: getRequestHeaders(accessToken),
      signal: AbortSignal.timeout(10_000),
    });
  } catch {
    return { ok: false, reason: "NETWORK_ERROR", retryAt: null };
  }

  const failure = getResponseFailure(response, now());
  if (failure) return failure;

  let body: unknown;
  try {
    body = await response.json();
  } catch {
    return { ok: false, reason: "INVALID_RESPONSE", retryAt: null };
  }

  const parsed = githubCommitListResponseSchema.safeParse(body);
  if (!parsed.success) {
    return { ok: false, reason: "INVALID_RESPONSE", retryAt: null };
  }

  return {
    ok: true,
    commits: parsed.data.map(toCommitDto),
    rateLimit: readRateLimit(response.headers),
  };
}
