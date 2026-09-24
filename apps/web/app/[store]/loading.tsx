import { Card, Skeleton } from "@sellly/ui";

export default function Loading() {
  return (
    <div className="space-y-8" aria-busy="true" aria-live="polite">
      <span className="sr-only">Loading…</span>
      <div className="space-y-2">
        <Skeleton className="h-7 w-64" />
        <Skeleton className="h-4 w-80 max-w-full" />
      </div>
      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <Card key={i} className="space-y-4 p-5 sm:p-5">
            <Skeleton className="h-3.5 w-20" />
            <Skeleton className="h-8 w-28" />
            <Skeleton className="h-3.5 w-24" />
          </Card>
        ))}
      </div>
      <Card>
        <Skeleton className="mb-6 h-4 w-32" />
        <Skeleton className="h-[220px] w-full" />
      </Card>
    </div>
  );
}
