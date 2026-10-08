import { describe, expect, it } from "vitest";

import {
  createProjectSchema,
  projectListSearchParamsSchema,
} from "./schemas";

const validInput = {
  title: "  DevLog  ",
  description: "  개발 기록 서비스  ",
  status: "IN_PROGRESS",
  startDate: "2026-10-01",
  endDate: "2026-10-31",
  repositoryUrl: "https://github.com/example/devlog",
  technologyNames: ["Next.js"],
};

describe("createProjectSchema", () => {
  it("normalizes valid project input", () => {
    const result = createProjectSchema.safeParse(validInput);

    expect(result.success).toBe(true);

    if (result.success) {
      expect(result.data.title).toBe("DevLog");
      expect(result.data.description).toBe("개발 기록 서비스");
      expect(result.data.startDate?.toISOString()).toBe(
        "2026-10-01T00:00:00.000Z",
      );
    }
  });

  it("allows optional fields and technology selections to be empty", () => {
    const result = createProjectSchema.safeParse({
      title: "DevLog",
      description: "",
      status: "PLANNING",
      startDate: "",
      endDate: "",
      repositoryUrl: "",
      technologyNames: [],
    });

    expect(result.success).toBe(true);

    if (result.success) {
      expect(result.data.description).toBeUndefined();
      expect(result.data.startDate).toBeUndefined();
      expect(result.data.repositoryUrl).toBeUndefined();
    }
  });

  it("rejects an end date before the start date", () => {
    const result = createProjectSchema.safeParse({
      ...validInput,
      startDate: "2026-11-01",
      endDate: "2026-10-31",
    });

    expect(result.success).toBe(false);

    if (!result.success) {
      expect(result.error.flatten().fieldErrors.endDate).toContain(
        "종료일은 시작일과 같거나 이후여야 합니다.",
      );
    }
  });

  it("rejects invalid calendar dates and non-GitHub URLs", () => {
    const result = createProjectSchema.safeParse({
      ...validInput,
      startDate: "2026-02-30",
      repositoryUrl: "https://example.com/devlog",
    });

    expect(result.success).toBe(false);

    if (!result.success) {
      const fieldErrors = result.error.flatten().fieldErrors;
      expect(fieldErrors.startDate).toBeDefined();
      expect(fieldErrors.repositoryUrl).toBeDefined();
    }

    const urlWithQuery = createProjectSchema.safeParse({
      ...validInput,
      repositoryUrl: "https://github.com/example/devlog?tab=readme",
    });

    expect(urlWithQuery.success).toBe(false);
  });

  it("rejects duplicate and unsupported technology names", () => {
    const duplicate = createProjectSchema.safeParse({
      ...validInput,
      technologyNames: ["Next.js", "Next.js"],
    });
    const unsupported = createProjectSchema.safeParse({
      ...validInput,
      technologyNames: ["Unknown technology"],
    });

    expect(duplicate.success).toBe(false);
    expect(unsupported.success).toBe(false);
  });
});

describe("projectListSearchParamsSchema", () => {
  it("normalizes a search query and status filter", () => {
    expect(
      projectListSearchParamsSchema.parse({
        q: "  devlog  ",
        status: "IN_PROGRESS",
      }),
    ).toEqual({ query: "devlog", status: "IN_PROGRESS" });
  });

  it("uses the first value when a search parameter is repeated", () => {
    expect(
      projectListSearchParamsSchema.parse({
        q: ["first", "second"],
        status: ["COMPLETED", "ARCHIVED"],
      }),
    ).toEqual({ query: "first", status: "COMPLETED" });
  });

  it("safely ignores unsupported or oversized filter values", () => {
    expect(
      projectListSearchParamsSchema.parse({
        q: "a".repeat(101),
        status: "UNKNOWN",
      }),
    ).toEqual({ query: "", status: undefined });
  });
});
