export function Skeleton({ className = '' }) {
  return <div className={`shimmer-bg rounded-lg ${className}`} />;
}

export function CardSkeleton() {
  return (
    <div className="glass rounded-xl p-4 space-y-3">
      <div className="flex items-center gap-3">
        <Skeleton className="w-10 h-10 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-3 w-16" />
        </div>
      </div>
      <Skeleton className="h-6 w-28" />
      <div className="flex gap-4">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-4 w-20" />
      </div>
    </div>
  );
}

export function ChartSkeleton() {
  return (
    <div className="w-full h-full flex items-center justify-center">
      <div className="text-center space-y-3">
        <div className="w-12 h-12 mx-auto border-2 border-neon-blue/30 border-t-neon-blue rounded-full animate-spin" />
        <p className="text-gray-500 text-sm">Loading chart data...</p>
      </div>
    </div>
  );
}
