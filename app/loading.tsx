import { Skeleton } from "@/components/ui/skeleton"

export default function Loading() {
  return (
    <div className="app-shell min-h-screen">
      {/* Desktop Sidebar Placeholder */}
      <aside className="hidden md:flex flex-col w-[240px] xl:w-[270px] p-6 border-r border-border h-screen sticky top-0 bg-background/50">
        <Skeleton className="h-7 w-32 mb-8" />
        <div className="space-y-3">
          <Skeleton className="h-10 w-full rounded-lg" />
          <Skeleton className="h-10 w-full rounded-lg" />
          <Skeleton className="h-10 w-full rounded-lg" />
          <Skeleton className="h-10 w-full rounded-lg" />
        </div>
        <div className="mt-auto space-y-3">
          <Skeleton className="h-14 w-full rounded-lg" />
          <Skeleton className="h-10 w-full rounded-lg" />
        </div>
      </aside>

      {/* Main Content Skeleton */}
      <main className="main-content">
        {/* Header Skeleton */}
        <header className="page-header">
          <div className="flex items-center gap-3 flex-1">
            <Skeleton className="h-6 w-28 md:hidden" />
            <Skeleton className="hidden md:block h-9 w-72 rounded-lg" />
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-9 w-9 rounded-lg" />
            <Skeleton className="h-9 w-9 rounded-lg" />
            <Skeleton className="h-9 w-9 rounded-lg" />
          </div>
        </header>

        {/* Mobile Search Placeholder */}
        <div className="px-4 pt-3 md:hidden">
          <Skeleton className="h-10 w-full rounded-lg" />
        </div>

        {/* Hero Promo Banner Skeleton */}
        <div className="px-4 md:px-7 mt-3">
          <div className="rounded-xl p-6 bg-raised border border-border space-y-3">
            <Skeleton className="h-5 w-24 rounded-full" />
            <Skeleton className="h-7 w-3/4 max-w-md rounded-md" />
            <Skeleton className="h-4 w-1/2 max-w-xs rounded-md" />
            <Skeleton className="h-9 w-32 rounded-lg mt-2" />
          </div>
        </div>

        {/* Category Filter Pills Skeleton */}
        <div className="h-scroll mt-4 pb-1">
          <Skeleton className="h-8 w-20 rounded-full flex-shrink-0" />
          <Skeleton className="h-8 w-24 rounded-full flex-shrink-0" />
          <Skeleton className="h-8 w-24 rounded-full flex-shrink-0" />
          <Skeleton className="h-8 w-28 rounded-full flex-shrink-0" />
        </div>

        {/* Section Header Skeleton */}
        <div className="section-header mt-3">
          <Skeleton className="h-5 w-32 rounded-md" />
          <Skeleton className="h-4 w-16 rounded-md" />
        </div>

        {/* Product Grid Skeleton */}
        <div className="product-grid">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div key={i} className="product-card">
              <Skeleton className="aspect-square w-full rounded-none" />
              <div className="p-3 space-y-2">
                <Skeleton className="h-3 w-16 rounded-sm" />
                <Skeleton className="h-4 w-5/6 rounded-sm" />
                <div className="flex items-center justify-between pt-2">
                  <Skeleton className="h-4 w-20 rounded-sm" />
                  <Skeleton className="h-7 w-7 rounded-md" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}
