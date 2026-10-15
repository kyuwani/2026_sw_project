import { describe, expect, it } from "vitest";

import { taskInputSchema, taskListSearchParamsSchema } from "./schemas";

const validInput = {
  title: "  프로젝트 목록 구현  ",
  description: "  목록과 빈 상태를 구현한다.  ",
  status: "IN_PROGRESS",
  priority: "HIGH",
  dueDate: "2026-10-20",
};

describe("taskInputSchema", () => {
  it("normalizes valid Task input", () => {
    const result = taskInputSchema.safeParse(validInput);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.title).toBe("프로젝트 목록 구현");
      expect(result.data.description).toBe("목록과 빈 상태를 구현한다.");
      expect(result.data.dueDate?.toISOString()).toBe(
        "2026-10-20T00:00:00.000Z",
      );
    }
  });

  it("allows optional values to be empty", () => {
    const result = taskInputSchema.safeParse({
      title: "Task",
      description: "",
      status: "TODO",
      priority: "MEDIUM",
      dueDate: "",
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.description).toBeUndefined();
      expect(result.data.dueDate).toBeUndefined();
    }
  });

  it("rejects invalid status, priority, and calendar dates", () => {
    const result = taskInputSchema.safeParse({
      ...validInput,
      status: "UNKNOWN",
      priority: "URGENT",
      dueDate: "2026-02-30",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      const errors = result.error.flatten().fieldErrors;
      expect(errors.status).toBeDefined();
      expect(errors.priority).toBeDefined();
      expect(errors.dueDate).toBeDefined();
    }
  });
});

describe("taskListSearchParamsSchema", () => {
  it("accepts multiple filters and sorting together", () => {
    expect(
      taskListSearchParamsSchema.parse({
        status: "IN_PROGRESS",
        priority: "HIGH",
        due: "OVERDUE",
        sort: "DUE_ASC",
      }),
    ).toEqual({
      status: "IN_PROGRESS",
      priority: "HIGH",
      due: "OVERDUE",
      sort: "DUE_ASC",
    });
  });

  it("safely ignores unsupported filter values", () => {
    expect(
      taskListSearchParamsSchema.parse({
        status: "UNKNOWN",
        priority: "URGENT",
        due: "LATER",
        sort: "RANDOM",
      }),
    ).toEqual({
      status: undefined,
      priority: undefined,
      due: undefined,
      sort: "UPDATED_DESC",
    });
  });
});
