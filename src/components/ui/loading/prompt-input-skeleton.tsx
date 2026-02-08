/**
 * Prompt Input Skeleton
 */

export default function PromptInputSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="h-5 w-32 bg-muted/50 rounded" />
      <div className="h-44 bg-muted/30 rounded-xl border border-border" />
      <div className="flex justify-end">
        <div className="h-12 w-40 bg-muted/50 rounded-xl" />
      </div>
    </div>
  );
}
