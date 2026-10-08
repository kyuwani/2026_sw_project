"use client";

import { useActionState, useId, useState } from "react";

import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { deleteProjectAction } from "@/features/projects/actions";

interface DeleteProjectDialogProps {
  projectId: string;
  projectTitle: string;
}

export function DeleteProjectDialog({
  projectId,
  projectTitle,
}: DeleteProjectDialogProps) {
  const [open, setOpen] = useState(false);
  const formId = useId();
  const action = deleteProjectAction.bind(null, projectId);
  const [state, formAction, pending] = useActionState(action, {});

  return (
    <>
      <Button onClick={() => setOpen(true)} variant="destructive">
        프로젝트 삭제
      </Button>
      <Dialog
        description="이 작업은 되돌릴 수 없습니다. 연결된 Task와 기술 정보도 함께 삭제됩니다."
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
        title="프로젝트를 삭제할까요?"
      >
        <form action={formAction} id={formId}>
          <p className="text-sm leading-6 text-foreground">
            <strong>{projectTitle}</strong> 프로젝트를 영구적으로 삭제합니다.
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
