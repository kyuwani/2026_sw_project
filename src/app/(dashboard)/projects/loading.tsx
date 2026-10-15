export default function ProjectsLoading() {
  return (
    <div aria-busy="true" aria-label="프로젝트 불러오는 중" className="space-y-8">
      <div className="h-20 animate-pulse rounded-card bg-surface-subtle" />
      <div className="h-28 animate-pulse rounded-card bg-surface-subtle" />
      <div className="grid gap-5 lg:grid-cols-2">
        <div className="h-80 animate-pulse rounded-card bg-surface-subtle" />
        <div className="h-80 animate-pulse rounded-card bg-surface-subtle" />
      </div>
      <p className="sr-only">프로젝트 정보를 불러오고 있습니다.</p>
    </div>
  );
}
