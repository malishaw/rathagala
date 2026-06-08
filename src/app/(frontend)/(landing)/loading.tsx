/**
 * Landing page skeleton — mirrors the real page layout:
 * • Header (from layout — always visible, skip here)
 * • Hero search bar section
 * • Category pills
 * • 2-column ad grid (left wide, right sidebar)
 */
export default function Loading() {
  return (
    <div className="bg-slate-50 min-h-screen">
      {/* ── Hero / Search Section ── */}
      <section className="bg-[#024950] py-8 md:py-10">
        <div className="container mx-auto px-4">
          {/* Search bar skeleton */}
          <div className="max-w-3xl mx-auto bg-white/10 rounded-xl h-[60px] animate-pulse" />
          {/* Category pills */}
          <div className="flex justify-center gap-2 mt-5">
            {[80, 56, 48, 60, 100, 76].map((w, i) => (
              <div
                key={i}
                className="h-7 bg-white/20 rounded-full animate-pulse"
                style={{ width: `${w}px`, animationDelay: `${i * 60}ms` }}
              />
            ))}
          </div>
        </div>
      </section>

      {/* ── Main Content ── */}
      <div className="py-4 md:py-6">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Left — Listings */}
            <div className="flex-1">
              {/* Header row: title + sort */}
              <div className="flex items-center justify-between mb-5">
                <div className="h-6 w-36 bg-slate-200 rounded animate-pulse" />
                <div className="h-8 w-36 bg-slate-200 rounded animate-pulse" />
              </div>

              {/* Ad cards grid — 2 columns */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Array.from({ length: 12 }).map((_, i) => (
                  <AdCardSkeleton key={i} delay={i * 40} />
                ))}
              </div>
            </div>

            {/* Right sidebar */}
            <div className="w-full lg:w-80 space-y-4 mt-2 lg:mt-0">
              {/* Ad banner placeholder */}
              <div
                className="bg-slate-200 rounded-xl h-64 animate-pulse"
                style={{ animationDelay: "200ms" }}
              />
              {/* Dealer cards */}
              <div className="bg-white border border-slate-100 rounded-xl p-4 space-y-3">
                <div className="h-4 w-28 bg-slate-200 rounded animate-pulse" />
                {[0, 1, 2].map((i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-slate-200 animate-pulse flex-shrink-0"
                      style={{ animationDelay: `${300 + i * 80}ms` }} />
                    <div className="flex-1 space-y-1.5">
                      <div className="h-3 w-24 bg-slate-200 rounded animate-pulse"
                        style={{ animationDelay: `${340 + i * 80}ms` }} />
                      <div className="h-2.5 w-16 bg-slate-200 rounded animate-pulse"
                        style={{ animationDelay: `${380 + i * 80}ms` }} />
                    </div>
                  </div>
                ))}
              </div>
              {/* Second ad banner */}
              <div
                className="bg-slate-200 rounded-xl h-48 animate-pulse"
                style={{ animationDelay: "500ms" }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/** Single ad card skeleton — mimics the horizontal card layout */
function AdCardSkeleton({ delay = 0 }: { delay?: number }) {
  return (
    <div
      className="bg-white rounded-sm border border-slate-200 overflow-hidden"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="p-2">
        <div className="flex gap-3">
          {/* Thumbnail */}
          <div
            className="w-24 sm:w-28 h-20 flex-shrink-0 bg-slate-200 rounded-sm animate-pulse"
            style={{ animationDelay: `${delay}ms` }}
          />
          {/* Text content */}
          <div className="flex-1 flex flex-col justify-between py-0.5">
            <div className="space-y-1.5">
              {/* Type badge */}
              <div
                className="h-2 w-14 bg-slate-200 rounded animate-pulse"
                style={{ animationDelay: `${delay + 30}ms` }}
              />
              {/* Title */}
              <div
                className="h-3.5 w-4/5 bg-slate-200 rounded animate-pulse"
                style={{ animationDelay: `${delay + 50}ms` }}
              />
              {/* Location */}
              <div
                className="h-2.5 w-2/5 bg-slate-200 rounded animate-pulse"
                style={{ animationDelay: `${delay + 70}ms` }}
              />
            </div>
            <div className="flex items-center justify-between">
              {/* Price */}
              <div
                className="h-3.5 w-20 bg-slate-200 rounded animate-pulse"
                style={{ animationDelay: `${delay + 90}ms` }}
              />
              {/* Time / views */}
              <div
                className="h-2.5 w-16 bg-slate-200 rounded animate-pulse"
                style={{ animationDelay: `${delay + 110}ms` }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
