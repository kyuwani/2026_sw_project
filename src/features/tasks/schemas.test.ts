import { describe, expect, it } from "vitest";

import { taskInputSchema } from "./schemas";

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
