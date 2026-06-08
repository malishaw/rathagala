import { Skeleton } from "@/components/ui/skeleton";

/**
 * Ad detail page skeleton — mirrors the exact layout of ads/[...slug]/page.tsx:
 * • Compact teal header bar
 * • Left: image viewer → thumbnail strip → specs → description
 * • Right (sticky): price card → seller card → analytics row → safety tips
 */
export default function Loading() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header bar */}
      <div className="bg-[#024950] h-12 flex items-center px-4">
        <div className="flex items-center gap-3 max-w-5xl mx-auto w-full">
          {/* Back */}
          <Skeleton className="h-5 w-10 bg-white/20 rounded" />
          {/* Title */}
          <Skeleton className="h-4 w-56 bg-white/20 rounded flex-1" />
          {/* Action icons */}
          <div className="flex gap-2">
            <Skeleton className="h-7 w-7 bg-white/20 rounded" />
            <Skeleton className="h-7 w-7 bg-white/20 rounded" />
            <Skeleton className="h-7 w-7 bg-white/20 rounded" />
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* ── Left Column ── */}
          <div className="lg:col-span-2 space-y-4">
            {/* Image viewer */}
            <div className="bg-white border border-gray-200 rounded overflow-hidden">
              {/* Main image area — aspect-video */}
              <div className="relative w-full" style={{ paddingTop: "56.25%" }}>
                <Skeleton className="absolute inset-0 w-full h-full rounded-none" />
                {/* image counter badge position */}
                <div className="absolute bottom-2 right-2 w-12 h-5 bg-black/20 rounded animate-pulse" />
              </div>
              {/* Thumbnail strip */}
              <div className="flex gap-1.5 p-2 bg-gray-50 border-t border-gray-100">
                {[0, 1, 2, 3, 4].map((i) => (
                  <Skeleton
                    key={i}
                    className="w-16 h-12 rounded flex-shrink-0"
                    style={{ animationDelay: `${i * 60}ms` }}
                  />
                ))}
              </div>
            </div>

            {/* Specs grid */}
            <div className="bg-white border border-gray-200 rounded p-4">
              {/* Section label */}
              <Skeleton className="h-2.5 w-24 mb-4 rounded" />
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-3">
                {[
                  [10, 16],
                  [10, 20],
                  [10, 14],
                  [10, 18],
                  [10, 22],
                  [10, 16],
                  [10, 12],
                  [10, 20],
                  [10, 18],
                ].map(([labelW, valueW], i) => (
                  <div key={i} style={{ animationDelay: `${40 + i * 30}ms` }}>
                    <Skeleton className="h-2 mb-1.5 rounded" style={{ width: `${labelW * 4}px` }} />
                    <Skeleton className="h-3.5 rounded" style={{ width: `${valueW * 4}px` }} />
                  </div>
                ))}
              </div>
            </div>

            {/* Features chips */}
            <div className="bg-white border border-gray-200 rounded p-4">
              <Skeleton className="h-2.5 w-32 mb-3 rounded" />
              <div className="flex flex-wrap gap-1.5">
                {[56, 72, 48, 80, 64, 52, 68, 44].map((w, i) => (
                  <Skeleton
                    key={i}
                    className="h-6 rounded"
                    style={{ width: `${w}px`, animationDelay: `${i * 40}ms` }}
                  />
                ))}
              </div>
            </div>

            {/* Description block */}
            <div className="bg-white border border-gray-200 rounded p-4">
              <Skeleton className="h-2.5 w-20 mb-4 rounded" />
              <div className="space-y-2">
                {[100, 95, 88, 100, 72, 100, 60].map((pct, i) => (
                  <Skeleton
                    key={i}
                    className="h-3.5 rounded"
                    style={{ width: `${pct}%`, animationDelay: `${i * 40}ms` }}
                  />
                ))}
              </div>
              <div className="flex items-center gap-4 mt-4 pt-3 border-t">
                <Skeleton className="h-3 w-16 rounded" />
                <Skeleton className="h-3 w-24 rounded" />
                <Skeleton className="h-3 w-20 rounded ml-auto" />
              </div>
            </div>
          </div>

          {/* ── Right Sidebar ── */}
          <div className="space-y-3">
            {/* Price + contact card */}
            <div className="bg-white border border-gray-200 rounded p-4 space-y-3">
              {/* Price */}
              <Skeleton className="h-6 w-36 rounded" />
              {/* Location */}
              <div className="flex items-center gap-2">
                <Skeleton className="h-3.5 w-3.5 rounded-full flex-shrink-0" />
                <Skeleton className="h-3.5 w-28 rounded" />
              </div>
              {/* Divider */}
              <div className="border-t border-gray-100 pt-3 space-y-2">
                {/* Phone button */}
                <Skeleton className="h-9 w-full rounded" />
                {/* WhatsApp button */}
                <Skeleton className="h-9 w-full rounded" />
              </div>
            </div>

            {/* Seller card */}
            <div className="bg-white border border-gray-200 rounded p-4">
              <div className="flex items-center gap-3 mb-3">
                <Skeleton className="h-10 w-10 rounded-full flex-shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-3.5 w-24 rounded" />
                  <Skeleton className="h-3 w-16 rounded" />
                </div>
              </div>
              <Skeleton className="h-8 w-full rounded" />
            </div>

            {/* Analytics row */}
            <div className="bg-white border border-gray-200 rounded p-3">
              <div className="flex items-center justify-between">
                <div className="space-y-1.5">
                  <Skeleton className="h-3 w-24 rounded" />
                  <Skeleton className="h-2.5 w-36 rounded" />
                </div>
                <div className="flex gap-3">
                  <Skeleton className="h-3 w-16 rounded" />
                  <Skeleton className="h-3 w-16 rounded" />
                </div>
              </div>
            </div>

            {/* Safety tips */}
            <div className="bg-white border border-gray-200 rounded p-4 space-y-2">
              <Skeleton className="h-2.5 w-20 mb-1 rounded" />
              {[65, 80, 55, 70, 60].map((w, i) => (
                <Skeleton
                  key={i}
                  className="h-2.5 rounded"
                  style={{ width: `${w}%`, animationDelay: `${i * 40}ms` }}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
