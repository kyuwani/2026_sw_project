import type { DashboardSummary } from "./queries";

export function isFirstDashboardVisit(
  dashboard: {
    summary: Pick<DashboardSummary, "totalProjects">;
    recentLearningLogs: readonly unknown[];
  },
): boolean {
  return (
    dashboard.summary.totalProjects === 0 &&
    dashboard.recentLearningLogs.length === 0
  );
}

export function getStudyBarHeight(
  minutes: number,
  maxMinutes: number,
): number {
  if (minutes <= 0) return 0;
  return Math.max(10, (minutes / Math.max(maxMinutes, 1)) * 100);
}
