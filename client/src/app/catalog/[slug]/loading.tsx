export default function ProductLoading() {
  return (
    <main className="flex-1 pt-20">
      <div className="container mx-auto px-4 py-8">
        {/* Breadcrumb skeleton */}
        <div className="flex items-center gap-2 mb-6">
          <div className="h-4 w-16 bg-[#1f1f23] rounded animate-pulse" />
          <div className="h-4 w-3 bg-[#26262b] rounded" />
          <div className="h-4 w-16 bg-[#1f1f23] rounded animate-pulse" />
          <div className="h-4 w-3 bg-[#26262b] rounded" />
          <div className="h-4 w-40 bg-[#1f1f23] rounded animate-pulse" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16">
          {/* Image skeleton */}
          <div className="space-y-4">
            <div className="aspect-square rounded-2xl bg-[#1f1f23] animate-pulse" />
            <div className="grid grid-cols-4 md:grid-cols-6 gap-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="aspect-square rounded-lg bg-[#1f1f23] animate-pulse" />
              ))}
            </div>
          </div>

          {/* Info skeleton */}
          <div className="space-y-4">
            <div className="h-10 w-3/4 bg-[#1f1f23] rounded animate-pulse" />
            <div className="flex gap-2">
              <div className="h-6 w-20 bg-[#1f1f23] rounded animate-pulse" />
              <div className="h-6 w-24 bg-[#1f1f23] rounded animate-pulse" />
            </div>
            <div className="h-5 w-32 bg-[#1f1f23] rounded animate-pulse" />
            <div className="h-12 w-48 bg-[#1f1f23] rounded animate-pulse" />
            <div className="h-5 w-40 bg-[#1f1f23] rounded animate-pulse" />
            <div className="grid grid-cols-3 gap-4 mt-8">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-20 bg-[#1f1f23] rounded-xl animate-pulse" />
              ))}
            </div>
            <div className="h-14 w-full bg-[#1f1f23] rounded-xl animate-pulse mt-8" />
            <div className="h-12 w-full bg-[#1f1f23] rounded-xl animate-pulse" />
          </div>
        </div>
      </div>
    </main>
  );
}
