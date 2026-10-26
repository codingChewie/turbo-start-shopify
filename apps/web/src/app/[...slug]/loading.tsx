import { Skeleton } from "@workspace/ui/components/skeleton";

export default function Loading() {
  return (
    <main className="site-container flex flex-col gap-6 py-16">
      <Skeleton className="h-10 w-1/2" />
      <Skeleton className="h-4 w-2/3" />
      <Skeleton className="aspect-video w-full" />
    </main>
  );
}
