export default function PageSkeleton() {
  return (
    <div className="max-w-4xl space-y-5 animate-pulse">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white rounded-2xl border border-gray-100 p-4 h-24">
            <div className="h-2.5 bg-gray-100 rounded w-2/3 mb-3" />
            <div className="h-8 bg-gray-100 rounded w-1/2" />
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {[1, 2].map((i) => (
          <div key={i} className="bg-white rounded-2xl border border-gray-100 p-4 h-20">
            <div className="h-2.5 bg-gray-100 rounded w-1/3 mb-3" />
            <div className="h-5 bg-gray-100 rounded w-1/2" />
          </div>
        ))}
      </div>
      <div className="bg-white rounded-2xl border border-gray-100 p-5">
        <div className="h-3 bg-gray-100 rounded w-1/4 mb-5" />
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="flex items-center justify-between py-3 border-b border-gray-50 last:border-0">
            <div className="space-y-2">
              <div className="h-3 bg-gray-100 rounded w-32" />
              <div className="h-2.5 bg-gray-100 rounded w-20" />
            </div>
            <div className="h-6 bg-gray-100 rounded-full w-16" />
          </div>
        ))}
      </div>
    </div>
  );
}
