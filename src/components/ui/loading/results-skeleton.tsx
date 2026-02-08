/**
 * Results Skeleton
 */

// Pre-defined widths to avoid Math.random during render
const SKELETON_WIDTHS = {
  issues: [85, 92, 78],
  improvements: [82, 88, 95],
  lines: [94, 98, 89, 96, 75],
};

export default function ResultsSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Analysis cards skeleton */}
      <div className="grid md:grid-cols-2 gap-4">
        {/* Issues card */}
        <div className="bg-amber-500/5 border border-amber-500/20 rounded-2xl p-5">
          <div className="flex items-center gap-2 h-5 w-32 bg-amber-500/10 rounded mb-3" />
          <div className="space-y-2">
            {SKELETON_WIDTHS.issues.map((width, i) => (
              <div
                key={i}
                className="h-4 bg-muted/50 rounded"
                style={{ width: `${width}%` }}
              />
            ))}
          </div>
        </div>

        {/* Improvements card */}
        <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-2xl p-5">
          <div className="flex items-center gap-2 h-5 w-36 bg-emerald-500/10 rounded mb-3" />
          <div className="space-y-2">
            {SKELETON_WIDTHS.improvements.map((width, i) => (
              <div
                key={i}
                className="h-4 bg-muted/50 rounded"
                style={{ width: `${width}%` }}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Improved prompt skeleton */}
      <div className="bg-card/30 border border-border rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="h-5 w-40 bg-primary/10 rounded" />
          <div className="h-8 w-24 bg-muted/50 rounded-lg" />
        </div>
        <div className="bg-background rounded-xl p-5 border border-border space-y-3">
          {SKELETON_WIDTHS.lines.map((width, i) => (
            <div
              key={i}
              className="h-4 bg-muted/30 rounded"
              style={{ width: `${width}%` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
