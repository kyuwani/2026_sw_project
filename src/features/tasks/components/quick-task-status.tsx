"use client";

import { Check, RotateCcw } from "lucide-react";
import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { setTaskCompletionAction } from "@/features/tasks/actions";
import type { TaskStatusValue } from "@/features/tasks/schemas";

interface QuickTaskStatusProps {
  projectId: string;
  taskId: string;
  status: TaskStatusValue;
}

export function QuickTaskStatus({
  projectId,
  taskId,
  status,
}: QuickTaskStatusProps) {
  const completed = status === "DONE";
  const action = setTaskCompletionAction.bind(
    null,
    projectId,
    taskId,
    completed ? "TODO" : "DONE",
  );
  const [state, formAction, pending] = useActionState(action, {});

  return (
    <div>
      <form action={formAction}>
        <Button
          loading={pending}
          loadingLabel="변경 중"
          size="sm"
          type="submit"
          variant={completed ? "outline" : "secondary"}
        >
          {completed ? (
            <RotateCcw aria-hidden="true" className="size-4" />
          ) : (
            <Check aria-hidden="true" className="size-4" />
          )}
          {completed ? "재개" : "완료"}
        </Button>
      </form>
      {state.message ? (
        <p
          aria-live="polite"
          className="mt-2 max-w-48 text-xs font-medium text-destructive"
          role="alert"
        >
          {state.message}
        </p>
      ) : null}
    </div>
  );
}
