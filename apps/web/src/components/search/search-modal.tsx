"use client";

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
} from "@workspace/ui/components/sheet";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

import { SearchPanel } from "./search-panel";

const SEARCH_PATH = "/search";

export function SearchModal({ initialQuery = "" }: { initialQuery?: string }) {
  const router = useRouter();
  const onSearchRoute = usePathname() === SEARCH_PATH;

  const [open, setOpen] = useState(true);
  // Radix keeps the node mounted through the exit animation, so we need a
  // second flag to drop the subtree once that has played — otherwise the panel
  // keeps its react-query subscription and the typed term leaks into the next
  // open (initialQuery can't reset a useState that never unmounted).
  const [rendered, setRendered] = useState(true);
  // Which of the two closes is in flight. A dismiss (Close / Esc / overlay) has
  // to pop the intercepted route; a result click has already navigated, and
  // popping there lands on the page the drawer was opened over.
  const dismissing = useRef(false);

  // A soft nav does NOT clear this slot: Next keeps an unmatched parallel
  // route's last render, and @modal/default.tsx only applies on a hard load. So
  // clicking a result leaves the drawer sitting over the new page unless we
  // notice the route ourselves. Mirrored both ways — leaving /search animates
  // out, coming back re-opens.
  useEffect(() => {
    if (onSearchRoute) {
      setRendered(true);
    }
    setOpen(onSearchRoute);
  }, [onSearchRoute]);

  const dismiss = useCallback(() => {
    dismissing.current = true;
    setOpen(false);
  }, []);

  if (!rendered) {
    return null;
  }

  return (
    <Sheet
      onOpenChange={(next) => {
        if (!next) {
          dismiss();
        }
      }}
      open={open}
    >
      <SheetContent
        className="h-dvh w-full gap-0 border-none p-0 data-[state=open]:duration-300 sm:max-w-none"
        onAnimationEnd={(event) => {
          // animationend bubbles, and it also fires for the enter animation —
          // neither is our exit finishing.
          if (open || event.target !== event.currentTarget) {
            return;
          }
          if (dismissing.current) {
            dismissing.current = false;
            router.back();
          }
          setRendered(false);
        }}
        showCloseButton={false}
        side="bottom"
      >
        <SheetTitle className="sr-only">Search</SheetTitle>
        <SheetDescription className="sr-only">
          Search products and collections
        </SheetDescription>

        <SearchPanel
          initialQuery={initialQuery}
          onClose={dismiss}
          replace
          scrollable
        />
      </SheetContent>
    </Sheet>
  );
}
