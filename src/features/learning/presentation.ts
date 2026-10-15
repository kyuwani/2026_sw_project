import type { LearningCategoryValue } from "./schemas";

export const LEARNING_CATEGORY_LABELS: Record<
  LearningCategoryValue,
  string
> = {
  LANGUAGE: "프로그래밍 언어",
  FRAMEWORK: "프레임워크·라이브러리",
  ALGORITHM: "알고리즘·자료구조",
  DATABASE: "데이터베이스",
  DEVOPS: "DevOps·인프라",
  OTHER: "기타",
};

const learningDateFormatter = new Intl.DateTimeFormat("ko-KR", {
  dateStyle: "long",
  timeZone: "UTC",
});

export function formatLearningDate(date: Date): string {
  return learningDateFormatter.format(date);
}

export function formatStudyDuration(studyMinutes: number): string {
  const hours = Math.floor(studyMinutes / 60);
  const minutes = studyMinutes % 60;

  if (hours === 0) {
    return `${minutes}분`;
  }

  if (minutes === 0) {
    return `${hours}시간`;
  }

  return `${hours}시간 ${minutes}분`;
}
