export function PageSkeleton() {
  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 animate-pulse">
      {/* Header skeleton */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-6 border-b border-gray-800">
        <div className="space-y-2">
          <div className="h-8 w-64 bg-gray-800/80 rounded-lg"></div>
          <div className="h-4 w-96 bg-gray-800/50 rounded"></div>
        </div>
        <div className="flex items-center gap-3">
          <div className="h-10 w-28 bg-gray-800/60 rounded-xl"></div>
          <div className="h-10 w-32 bg-purple-600/30 rounded-xl"></div>
        </div>
      </div>

      {/* Metric Cards Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="p-5 rounded-2xl bg-gray-900/60 border border-gray-800/80 space-y-3">
            <div className="flex justify-between items-center">
              <div className="h-4 w-24 bg-gray-800/60 rounded"></div>
              <div className="h-8 w-8 bg-gray-800/80 rounded-lg"></div>
            </div>
            <div className="h-8 w-36 bg-gray-800/90 rounded-lg"></div>
            <div className="h-3 w-28 bg-gray-800/40 rounded"></div>
          </div>
        ))}
      </div>

      {/* Main Content Area Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 p-6 rounded-2xl bg-gray-900/60 border border-gray-800/80 space-y-4">
          <div className="h-6 w-48 bg-gray-800/70 rounded"></div>
          <div className="h-64 bg-gray-800/30 rounded-xl"></div>
        </div>
        <div className="p-6 rounded-2xl bg-gray-900/60 border border-gray-800/80 space-y-4">
          <div className="h-6 w-36 bg-gray-800/70 rounded"></div>
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-12 bg-gray-800/40 rounded-xl"></div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function CardSkeleton() {
  return (
    <div className="p-5 rounded-2xl bg-gray-900/60 border border-gray-800/80 animate-pulse space-y-3">
      <div className="h-5 w-32 bg-gray-800/70 rounded"></div>
      <div className="h-8 w-24 bg-gray-800/90 rounded-lg"></div>
      <div className="h-3 w-40 bg-gray-800/40 rounded"></div>
    </div>
  );
}

export function TableSkeleton() {
  return (
    <div className="w-full space-y-3 animate-pulse">
      <div className="h-10 bg-gray-800/60 rounded-xl"></div>
      {[...Array(5)].map((_, i) => (
        <div key={i} className="h-14 bg-gray-900/40 border border-gray-800/60 rounded-xl"></div>
      ))}
    </div>
  );
}
