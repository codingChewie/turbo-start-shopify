import { Skeleton } from "@workspace/ui/components/skeleton";

export default function Loading() {
  return (
    <main className="site-container py-8">
      <Skeleton className="mb-8 h-8 w-48 md:h-10" />
      <div className="grid grid-cols-2 gap-x-1 gap-y-4 md:grid-cols-3 lg:grid-cols-4 lg:gap-y-6">
        {Array.from({ length: 8 }, (_, index) => (
          <div className="flex flex-col gap-2" key={index.toString()}>
            <Skeleton className="aspect-56/75 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/4" />
          </div>
        ))}
      </div>
    </main>
  );
}
