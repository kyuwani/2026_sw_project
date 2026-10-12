export default function ProfileLoading() {
  return (
    <div aria-busy="true" aria-label="프로필 불러오는 중" className="space-y-8">
      <div className="h-20 animate-pulse rounded-card bg-surface-subtle" />
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="h-[34rem] animate-pulse rounded-card bg-surface-subtle" />
        <div className="space-y-6">
          <div className="h-64 animate-pulse rounded-card bg-surface-subtle" />
          <div className="h-40 animate-pulse rounded-card bg-surface-subtle" />
        </div>
      </div>
      <p className="sr-only">프로필 정보를 불러오고 있습니다.</p>
    </div>
  );
}
