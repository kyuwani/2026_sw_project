export default function LearningLoading() {
  return (
    <div aria-busy="true" aria-label="학습 기록 불러오는 중" className="space-y-8">
      <div className="h-20 animate-pulse rounded-card bg-surface-subtle" />
      <div className="grid gap-5 lg:grid-cols-2">
        <div className="h-72 animate-pulse rounded-card bg-surface-subtle" />
        <div className="h-72 animate-pulse rounded-card bg-surface-subtle" />
      </div>
      <p className="sr-only">학습 기록을 불러오고 있습니다.</p>
    </div>
  );
}
