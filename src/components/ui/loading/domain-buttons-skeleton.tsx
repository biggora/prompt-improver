/**
 * Domain Buttons Skeleton
 */

export default function DomainButtonsSkeleton() {
  return (
    <div className="flex flex-wrap gap-3 animate-pulse">
      {[...Array(5)].map((_, i) => (
        <div
          key={i}
          className="h-12 w-28 bg-muted/50 rounded-xl border border-border"
        />
      ))}
    </div>
  );
}
