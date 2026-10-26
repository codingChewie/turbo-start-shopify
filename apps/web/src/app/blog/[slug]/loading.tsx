import { Skeleton } from "@workspace/ui/components/skeleton";

export default function Loading() {
  return (
    <div className="site-container px-4 py-16 md:px-8">
      <header className="flex flex-col gap-6 pb-18">
        <Skeleton className="h-12 w-full max-w-4xl md:h-14 lg:h-16" />
        <Skeleton className="h-4 w-48" />
        <Skeleton className="h-8 w-40" />
      </header>
      <div className="flex max-w-3xl flex-col gap-3">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
        <Skeleton className="h-4 w-2/3" />
      </div>
    </div>
  );
}
