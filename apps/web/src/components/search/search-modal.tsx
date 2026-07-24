"use client";

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
} from "@workspace/ui/components/sheet";
import { useRouter } from "next/navigation";

import { SearchPanel } from "./search-panel";

export function SearchModal({ initialQuery = "" }: { initialQuery?: string }) {
  const router = useRouter();

  return (
    <Sheet
      onOpenChange={(open) => {
        if (!open) {
          router.back();
        }
      }}
      open
    >
      <SheetContent
        className="h-dvh w-full gap-0 border-none p-0 sm:max-w-none"
        showCloseButton={false}
        side="bottom"
      >
        <SheetTitle className="sr-only">Search</SheetTitle>
        <SheetDescription className="sr-only">
          Search products and collections
        </SheetDescription>

        <SearchPanel
          initialQuery={initialQuery}
          onClose={() => router.back()}
          scrollable
        />
      </SheetContent>
    </Sheet>
  );
}
