"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import {
  connectProjectRepositoryAction,
  disconnectProjectRepositoryAction,
} from "../actions";
import type { RepositoryConnectionActionState } from "../schemas";

export interface RepositoryOption {
  externalId: number;
  fullName: string;
  visibility: "PRIVATE" | "PUBLIC";
  isArchived: boolean;
}

interface RepositoryConnectionFormProps {
  projectId: string;
  repositories: RepositoryOption[];
  currentExternalId: string | null;
  listTruncated: boolean;
  listStatus:
    | "CONNECTED"
    | "NOT_CONNECTED"
    | "REAUTH_REQUIRED"
    | "RATE_LIMITED"
    | "UNAVAILABLE";
}

const initialState: RepositoryConnectionActionState = {};

export function RepositoryConnectionForm({
  projectId,
  repositories,
  currentExternalId,
  listTruncated,
  listStatus,
}: RepositoryConnectionFormProps) {
  const connectAction = connectProjectRepositoryAction.bind(null, projectId);
  const disconnectAction = disconnectProjectRepositoryAction.bind(
    null,
    projectId,
  );
  const [connectState, connectFormAction, connectPending] = useActionState(
    connectAction,
    initialState,
  );
  const [disconnectState, disconnectFormAction, disconnectPending] =
    useActionState(disconnectAction, initialState);
  const listAvailable = listStatus === "CONNECTED";
  const statusMessage =
    listStatus === "NOT_CONNECTED"
      ? "GitHub 계정을 연결하면 Repository를 선택할 수 있습니다."
      : listStatus === "REAUTH_REQUIRED"
        ? "GitHub 권한을 다시 확인해 주세요."
        : listStatus === "RATE_LIMITED"
          ? "GitHub 요청 한도에 도달했습니다. 잠시 후 다시 시도해 주세요."
          : listStatus === "UNAVAILABLE"
            ? "GitHub Repository 목록을 불러오지 못했습니다."
            : repositories.length === 0
              ? "선택할 수 있는 Repository가 없습니다."
              : null;
  const feedback = disconnectState.message ?? connectState.message;
  const feedbackSuccess = disconnectState.success ?? connectState.success;

  return (
    <div className="space-y-3">
      <form action={connectFormAction} className="space-y-3">
        <Select
          defaultValue={currentExternalId ?? ""}
          disabled={!listAvailable || repositories.length === 0 || connectPending}
          id="repositoryId"
          label="Repository 선택"
          name="repositoryId"
        >
          <option disabled value="">
            Repository를 선택해 주세요
          </option>
          {repositories.map((repository) => (
            <option key={repository.externalId} value={repository.externalId}>
              {repository.fullName}
              {repository.visibility === "PRIVATE" ? " · Private" : ""}
              {repository.isArchived ? " · 보관됨" : ""}
            </option>
          ))}
        </Select>
        {statusMessage ? (
          <p className="text-sm leading-6 text-muted">{statusMessage}</p>
        ) : null}
        {listAvailable && listTruncated ? (
          <p className="text-sm leading-6 text-muted">
            최근 업데이트된 Repository 100개만 표시합니다.
          </p>
        ) : null}
        <div className="flex flex-wrap gap-2">
          <Button
            disabled={!listAvailable || repositories.length === 0}
            loading={connectPending}
            loadingLabel="연결 중"
            size="sm"
            type="submit"
          >
            {currentExternalId ? "연결 변경" : "Repository 연결"}
          </Button>
        </div>
      </form>
      {currentExternalId ? (
        <form action={disconnectFormAction}>
          <Button
            loading={disconnectPending}
            loadingLabel="해제 중"
            size="sm"
            type="submit"
            variant="outline"
          >
            연결 해제
          </Button>
        </form>
      ) : null}
      {feedback ? (
        <p
          aria-live="polite"
          className={feedbackSuccess ? "text-sm text-success" : "text-sm text-destructive"}
          role={feedbackSuccess ? "status" : "alert"}
        >
          {feedback}
        </p>
      ) : null}
    </div>
  );
}
