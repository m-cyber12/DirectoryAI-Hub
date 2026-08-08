/**
 * Audit fix 4.2 — skeleton loading states.
 * On slow connections, tool cards pop in jarringly without a loading state.
 * This component shows a shimmer placeholder that matches the card layout.
 */
export function SkeletonCard() {
  return (
    <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-white/10 bg-surface-1">
      {/* Cover skeleton */}
      <div className="relative aspect-[16/9] skeleton" />

      <div className="flex flex-1 flex-col p-4">
        <div className="mb-2 flex items-start gap-3">
          <div className="h-10 w-10 shrink-0 rounded-xl skeleton" />
          <div className="min-w-0 flex-1 space-y-2">
            <div className="h-4 w-3/4 rounded skeleton" />
            <div className="h-3 w-1/2 rounded skeleton" />
          </div>
        </div>

        <div className="mb-2 flex items-center gap-2">
          <div className="h-5 w-10 rounded skeleton" />
          <div className="h-3 w-16 rounded skeleton" />
        </div>

        <div className="mb-1 h-4 w-full rounded skeleton" />
        <div className="h-3 w-5/6 rounded skeleton" />

        <div className="mt-3 flex gap-1">
          <div className="h-5 w-16 rounded-md skeleton" />
          <div className="h-5 w-20 rounded-md skeleton" />
          <div className="h-5 w-14 rounded-md skeleton" />
        </div>

        <div className="mt-4 flex items-center gap-1.5 pt-1">
          <div className="h-9 flex-1 rounded-xl skeleton" />
          <div className="h-9 w-20 rounded-xl skeleton" />
          <div className="h-9 w-9 rounded-xl skeleton" />
        </div>
      </div>
    </div>
  );
}
