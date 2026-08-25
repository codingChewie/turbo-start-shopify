/**
 * What a failed search looks like.
 *
 * Without it, `data ?? EMPTY` rendered `0 results for "jacket"` and "No products
 * found." — byte-identical to a search that genuinely matched nothing, so a
 * shopper looking for a product the store sells was told it does not sell it.
 *
 * No retry button on purpose: the search box stays on screen above this on both
 * surfaces, so retyping is already the retry. Deliberately shorter than the blog
 * `ErrorState`, whose "check your internet connection" list guesses at a cause
 * we do not know.
 */
export function SearchUnavailable() {
  return (
    <div className="py-16 text-center">
      <p className="font-medium text-base text-destructive">
        Search isn&apos;t available
      </p>
      <p className="mt-1 text-muted-foreground text-sm tracking-wide">
        Our catalogue didn&apos;t answer just now. Try again in a moment.
      </p>
    </div>
  );
}
