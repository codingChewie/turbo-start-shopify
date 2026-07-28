"use client";

import { cn } from "@workspace/ui/lib/utils";
import { X } from "lucide-react";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

import { SearchEmptyState } from "./search-empty-state";
import { SearchResults } from "./search-results";
import { useProductSearch } from "./use-product-search";

const SEARCH_PATH = "/search";

type SearchPanelProps = {
  initialQuery?: string;
  /** When provided, renders a "Close" button that calls this handler. */
  onClose?: () => void;
  /** Fill the parent height with an internal scroll area (used inside the drawer). */
  scrollable?: boolean;
  /**
   * Replace the current history entry when a result is opened instead of
   * pushing. Set by the drawer so Back from a product goes to the page the
   * search was opened over, not back into the search.
   */
  replace?: boolean;
};

export function SearchPanel({
  initialQuery = "",
  onClose,
  scrollable = false,
  replace,
}: SearchPanelProps) {
  const pathname = usePathname();
  const {
    query,
    setQuery,
    debouncedQuery,
    products,
    collections,
    related,
    isSearching,
    hasQuery,
  } = useProductSearch(initialQuery);

  // Keep the URL in sync with the query so a refresh / shared link lands on the
  // /search page with the same term. history.replaceState, not router.replace,
  // for the same reason as search-page-content: a router nav here costs an RSC
  // round-trip per keystroke, and a debounce landing just after the user opened
  // a result would drag the URL back off that product.
  useEffect(() => {
    if (pathname !== SEARCH_PATH) {
      return;
    }
    const trimmed = debouncedQuery.trim();
    window.history.replaceState(
      null,
      "",
      trimmed ? `/search?q=${encodeURIComponent(trimmed)}` : SEARCH_PATH
    );
  }, [debouncedQuery, pathname]);

  // Focus the input when the panel mounts.
  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  return (
    <div className={cn("flex flex-col", scrollable && "h-full")}>
      <div className="flex items-center gap-4 border-b px-4 py-4 md:px-8">
        <input
          className="flex-1 bg-transparent text-base text-foreground outline-none placeholder:text-muted-foreground"
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Start typing to search…"
          ref={inputRef}
          type="text"
          value={query}
        />
        {onClose && (
          <button
            className="inline-flex items-center gap-1 text-base text-foreground tracking-[0.24px] transition-opacity hover:opacity-70"
            onClick={onClose}
            type="button"
          >
            Close
            <X className="size-4.5" />
          </button>
        )}
      </div>

      <div
        className={cn("bg-muted/30", scrollable && "flex-1 overflow-y-auto")}
      >
        {hasQuery ? (
          <SearchResults
            collections={collections}
            isSearching={isSearching}
            onSelectTerm={setQuery}
            products={products}
            related={related}
            replace={replace}
          />
        ) : (
          <SearchEmptyState onSelectTerm={setQuery} replace={replace} />
        )}
      </div>
    </div>
  );
}
