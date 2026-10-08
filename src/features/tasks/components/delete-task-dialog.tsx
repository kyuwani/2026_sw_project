"use client";

import { useActionState, useId, useState } from "react";

import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { deleteTaskAction } from "@/features/tasks/actions";

interface DeleteTaskDialogProps {
  projectId: string;
  taskId: string;
  taskTitle: string;
}

export function DeleteTaskDialog({
  projectId,
  taskId,
  taskTitle,
}: DeleteTaskDialogProps) {
  const [open, setOpen] = useState(false);
  const formId = useId();
  const action = deleteTaskAction.bind(null, projectId, taskId);
  const [state, formAction, pending] = useActionState(action, {});

  return (
    <>
      <Button onClick={() => setOpen(true)} size="sm" variant="ghost">
        삭제
      </Button>
      <Dialog
        description="삭제한 Task는 복구할 수 없습니다."
        footer={
          <>
            <Button
              disabled={pending}
              onClick={() => setOpen(false)}
              variant="outline"
            >
              취소
            </Button>
            <Button
              form={formId}
              loading={pending}
              loadingLabel="삭제 중"
              type="submit"
              variant="destructive"
            >
              삭제하기
            </Button>
          </>
        }
        onOpenChange={setOpen}
        open={open}
        size="sm"
        title="Task를 삭제할까요?"
      >
        <form action={formAction} id={formId}>
          <p className="text-sm leading-6 text-foreground">
            <strong>{taskTitle}</strong> Task를 영구적으로 삭제합니다.
          </p>
          {state.message ? (
            <p
              aria-live="polite"
              className="mt-4 rounded-control border border-destructive/30 bg-destructive-soft px-3.5 py-3 text-sm text-destructive"
              role="alert"
            >
              {state.message}
            </p>
          ) : null}
        </form>
      </Dialog>
    </>
  );
}
