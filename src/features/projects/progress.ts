export function calculateTaskProgress(
  taskCount: number,
  completedTaskCount: number,
): number {
  if (taskCount <= 0) {
    return 0;
  }

  return Math.round((completedTaskCount / taskCount) * 100);
}
