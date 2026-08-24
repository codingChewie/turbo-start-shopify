"use client";

import { Button } from "@workspace/ui/components/button";
import Link from "next/link";

/**
 * The boundary every route falls back to when nothing closer catches a throw.
 *
 * The collections index throws on purpose rather than degrading to an empty
 * grid — see the comment in `collections/page.tsx` for why a baked "no
 * collections" page is worse than an error. Without this file that decision
 * reaches a shopper as Next's built-in error page: white, chrome-less,
 * "Application error: a server-side exception has occurred" and a digest hash.
 *
 * Rendered inside the root layout, so the navbar and footer stay on screen and
 * a shopper can leave by any of the routes they arrived with. The flip side is
 * that it cannot catch a throw from the root layout itself: `lib/navigation.ts`
 * passes its Sanity read straight into `layout.tsx`, so a full outage still
 * bypasses this and would need a `global-error.tsx`.
 *
 * `reset()` re-renders the segment, which is the whole fix for the transient
 * read failure this mostly catches. The secondary link goes home rather than to
 * `/collections`, since the collections index is the route most likely to have
 * sent a shopper here and that CTA would loop them straight back into it.
 */
export default function RootError({ reset }: { reset: () => void }) {
  return (
    <div className="site-container grid min-h-[60vh] content-center justify-items-center gap-4 py-16 text-center">
      <h1 className="font-light text-3xl tracking-tight md:text-4xl">
        This page couldn&apos;t be loaded
      </h1>
      <p className="max-w-prose text-muted-foreground text-sm tracking-wide">
        Something went wrong at our end. Nothing is missing — try again in a
        moment.
      </p>
      <div className="mt-4 flex gap-3">
        <Button
          className="uppercase tracking-wider"
          onClick={reset}
          size="lg"
          type="button"
        >
          Try again
        </Button>
        <Button
          asChild
          className="uppercase tracking-wider"
          size="lg"
          variant="secondary"
        >
          <Link href="/">Go Home</Link>
        </Button>
      </div>
    </div>
  );
}
