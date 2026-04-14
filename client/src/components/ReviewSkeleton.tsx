'use client';

export default function ReviewSkeleton() {
  return (
    <>
      <div className="review-skeleton card overflow-hidden rounded-2xl border border-[#26262b] bg-[#18181c] p-6">
        <div className="mb-4 flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="skeleton-block h-10 w-10 rounded-full" />
            <div className="space-y-2">
              <div className="skeleton-block h-4 w-28 rounded-full" />
              <div className="flex gap-1.5">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="skeleton-block h-4 w-4 rounded-sm" />
                ))}
              </div>
            </div>
          </div>
          <div className="skeleton-block h-3 w-20 rounded-full" />
        </div>

        <div className="mb-4 space-y-2">
          <div className="skeleton-block h-3 w-full rounded-full" />
          <div className="skeleton-block h-3 w-11/12 rounded-full" />
          <div className="skeleton-block h-3 w-3/5 rounded-full" />
        </div>

        <div className="mb-3 rounded-2xl border border-[#26262b] bg-[#131317] p-3">
          <div className="skeleton-block mb-2 h-3 w-24 rounded-full" />
          <div className="skeleton-block h-3 w-4/5 rounded-full" />
        </div>

        <div className="rounded-2xl border border-[#26262b] bg-[#131317] p-3">
          <div className="skeleton-block mb-2 h-3 w-20 rounded-full" />
          <div className="skeleton-block h-3 w-2/3 rounded-full" />
        </div>

        <div className="mt-4 flex gap-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="skeleton-block h-16 w-16 rounded-xl sm:h-20 sm:w-20" />
          ))}
        </div>
      </div>

      <style jsx>{`
        .review-skeleton {
          position: relative;
          isolation: isolate;
        }

        .skeleton-block {
          position: relative;
          overflow: hidden;
          background: linear-gradient(90deg, rgba(38, 38, 43, 0.96) 0%, rgba(63, 63, 70, 0.96) 50%, rgba(38, 38, 43, 0.96) 100%);
          background-size: 200% 100%;
          animation: review-shimmer 1.8s linear infinite;
        }

        @keyframes review-shimmer {
          0% {
            background-position: 200% 0;
          }
          100% {
            background-position: -200% 0;
          }
        }
      `}</style>
    </>
  );
}
