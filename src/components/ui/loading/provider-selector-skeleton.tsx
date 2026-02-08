/**
 * Provider Selector Skeleton
 */

export default function ProviderSelectorSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      {/* Provider dropdown skeleton */}
      <div className="flex gap-4">
        <div className="flex-1 h-12 bg-muted/50 rounded-xl border border-border" />
        <div className="w-48 h-12 bg-muted/50 rounded-xl border border-border" />
      </div>
    </div>
  );
}
