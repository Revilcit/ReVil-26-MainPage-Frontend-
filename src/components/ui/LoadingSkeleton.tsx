/**
 * Loading Skeleton Component
 * Shows while content is loading to improve perceived performance
 */

export function EventCardSkeleton() {
  return (
    <div className="event-card animate-pulse">
      <div className="h-48 bg-gray-300 dark:bg-gray-700 rounded-t-lg"></div>
      <div className="p-4 space-y-3">
        <div className="h-6 bg-gray-300 dark:bg-gray-700 rounded w-3/4"></div>
        <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-full"></div>
        <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-5/6"></div>
        <div className="flex gap-2">
          <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-24"></div>
          <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-24"></div>
        </div>
      </div>
    </div>
  );
}

export function EventListSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <EventCardSkeleton key={i} />
      ))}
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-8 animate-pulse">
      {/* Header */}
      <div className="h-12 bg-gray-300 dark:bg-gray-700 rounded w-64"></div>
      
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-32 bg-gray-300 dark:bg-gray-700 rounded"></div>
        ))}
      </div>
      
      {/* Content */}
      <div className="space-y-4">
        <div className="h-8 bg-gray-300 dark:bg-gray-700 rounded w-48"></div>
        <div className="h-64 bg-gray-300 dark:bg-gray-700 rounded"></div>
      </div>
    </div>
  );
}
