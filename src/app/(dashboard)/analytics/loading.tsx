function Skeleton({ className }: { className: string }) {
  return <div className={`animate-pulse rounded-lg bg-surface-subtle ${className}`} />;
}

export default function AnalyticsLoading() {
  return (
    <div className="space-y-8" aria-busy="true" aria-label="Analytics 불러오는 중">
      <div className="space-y-3">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-9 w-52" />
        <Skeleton className="h-5 w-full max-w-xl" />
      </div>
      <Skeleton className="h-36 w-full" />
      <Skeleton className="h-64 w-full" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <Skeleton className="h-36 w-full" key={index} />
        ))}
      </div>
      <Skeleton className="h-52 w-full" />
      <div className="grid gap-6 xl:grid-cols-2">
        <Skeleton className="h-96 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    </div>
  );
}
