import { Skeleton } from "@workspace/ui/components/skeleton";

export default function Loading() {
  return (
    <main className="site-container py-8">
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,480px)] xl:grid-cols-[minmax(0,1fr)_minmax(0,600px)] 2xl:grid-cols-[minmax(0,1fr)_minmax(0,760px)]">
        <div className="flex min-w-0 max-w-2xl flex-col gap-8">
          <Skeleton className="h-4 w-24" />
          <div className="flex flex-col gap-2">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-6 w-24" />
          </div>
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-11 w-full" />
        </div>
        <Skeleton className="aspect-56/75 w-full" />
      </div>
    </main>
  );
}
