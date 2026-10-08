export default function TasksLoading() {
  return (
    <div aria-busy="true" aria-label="Task 불러오는 중" className="space-y-8">
      <div className="h-20 animate-pulse rounded-card bg-surface-subtle" />
      <div className="h-32 animate-pulse rounded-card bg-surface-subtle" />
      <div className="space-y-4">
        <div className="h-44 animate-pulse rounded-card bg-surface-subtle" />
        <div className="h-44 animate-pulse rounded-card bg-surface-subtle" />
      </div>
      <p className="sr-only">Task 목록을 불러오고 있습니다.</p>
    </div>
  );
}
