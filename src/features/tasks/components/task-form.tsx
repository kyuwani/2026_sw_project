"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { ButtonLink } from "@/components/ui/button-link";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  createTaskAction,
  updateTaskAction,
} from "@/features/tasks/actions";
import type {
  TaskPriorityValue,
  TaskStatusValue,
} from "@/features/tasks/schemas";

interface TaskFormValues {
  id: string;
  title: string;
  description: string;
  status: TaskStatusValue;
  priority: TaskPriorityValue;
  dueDate: string;
}

interface TaskFormProps {
  projectId: string;
  task?: TaskFormValues;
}

export function TaskForm({ projectId, task }: TaskFormProps) {
  const action = task
    ? updateTaskAction.bind(null, projectId, task.id)
    : createTaskAction.bind(null, projectId);
  const [state, formAction, pending] = useActionState(action, {});

  return (
    <form action={formAction}>
      <Card className="overflow-hidden">
        <CardHeader className="border-b border-border">
          <CardTitle>{task ? "Task 수정" : "Task 정보"}</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-6 pt-5 sm:pt-6">
          <Input
            autoComplete="off"
            defaultValue={task?.title}
            error={state.fieldErrors?.title?.[0]}
            id="task-title"
            label="제목"
            maxLength={150}
            name="title"
            placeholder="예: 프로젝트 목록 화면 구현"
            required
          />
          <Textarea
            defaultValue={task?.description}
            error={state.fieldErrors?.description?.[0]}
            id="task-description"
            label="설명"
            maxLength={2000}
            name="description"
            placeholder="Task의 완료 조건이나 참고 내용을 적어 주세요."
            rows={5}
          />
          <div className="grid gap-5 sm:grid-cols-2">
            <Select
              defaultValue={task?.status ?? "TODO"}
              error={state.fieldErrors?.status?.[0]}
              id="task-status"
              label="상태"
              name="status"
              required
            >
              <option value="TODO">할 일</option>
              <option value="IN_PROGRESS">진행 중</option>
              <option value="DONE">완료</option>
            </Select>
            <Select
              defaultValue={task?.priority ?? "MEDIUM"}
              error={state.fieldErrors?.priority?.[0]}
              id="task-priority"
              label="우선순위"
              name="priority"
              required
            >
              <option value="LOW">낮음</option>
              <option value="MEDIUM">보통</option>
              <option value="HIGH">높음</option>
            </Select>
          </div>
          <Input
            defaultValue={task?.dueDate}
            error={state.fieldErrors?.dueDate?.[0]}
            id="task-due-date"
            label="마감일"
            name="dueDate"
            type="date"
          />
          {state.message ? (
            <p
              aria-live="polite"
              className="rounded-control border border-destructive/30 bg-destructive-soft px-3.5 py-3 text-sm text-destructive"
              role="alert"
            >
              {state.message}
            </p>
          ) : null}
        </CardContent>
        <CardFooter>
          <ButtonLink href={`/projects/${projectId}`} variant="outline">
            취소
          </ButtonLink>
          <Button loading={pending} loadingLabel="저장 중" type="submit">
            {task ? "변경사항 저장" : "Task 추가"}
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
}
