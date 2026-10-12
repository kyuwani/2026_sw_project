function SkeletonBlock({ className }: { className: string }) {
  return <div className={`animate-pulse rounded-lg bg-surface-subtle ${className}`} />;
}

export default function DashboardLoading() {
  return (
    <div className="space-y-8" aria-busy="true" aria-label="Dashboard 불러오는 중">
      <div className="space-y-3">
        <SkeletonBlock className="h-4 w-32" />
        <SkeletonBlock className="h-9 w-full max-w-72" />
        <SkeletonBlock className="h-5 w-full max-w-xl" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <div
            key={index}
            className="rounded-card border border-border bg-card p-5 sm:p-6"
          >
            <SkeletonBlock className="h-4 w-24" />
            <SkeletonBlock className="mt-5 h-8 w-20" />
            <SkeletonBlock className="mt-3 h-4 w-36 max-w-full" />
          </div>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.45fr)_minmax(0,0.75fr)]">
        <SkeletonBlock className="h-80 w-full" />
        <SkeletonBlock className="h-80 w-full" />
      </div>
    </div>
  );
}
