"use client";

import { cn } from "@workspace/ui/lib/utils";
import { X } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";

import {
  clearAllFilters,
  getActiveFilters,
  removeFilterParam,
} from "@/components/collection/filter-utils";
import { useListingControls } from "@/components/collection/listing-controls";
import { getColorHex } from "@/lib/shopify/color";

/** Color-option chips (filter.option.color) show their swatch. */
function isColorParam(paramKey: string): boolean {
  return /^filter\.option\.colou?r$/i.test(paramKey);
}

export function ActiveFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { filterOpen } = useListingControls();
  const active = getActiveFilters(searchParams);

  const handleRemove = useCallback(
    (paramKey: string, paramValue: string) => {
      const qs = removeFilterParam(searchParams, paramKey, paramValue);
      router.push(qs ? `?${qs}` : pathname, { scroll: false });
    },
    [router, pathname, searchParams]
  );

  const handleClearAll = useCallback(() => {
    const qs = clearAllFilters(searchParams);
    router.push(qs ? `?${qs}` : pathname, { scroll: false });
  }, [router, pathname, searchParams]);

  // Selections are shown as underlines inside the open panel; chips appear
  // only once the panel is collapsed.
  if (filterOpen || active.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2">
      {active.map((filter) => {
        const hex = isColorParam(filter.paramKey)
          ? getColorHex(filter.paramValue)
          : undefined;
        return (
          <button
            className={cn(
              "flex items-center gap-1.5 px-3 py-1 text-sm tracking-[0.24px] transition-colors",
              filter.invalid
                ? "bg-destructive/15 text-destructive hover:bg-destructive/25"
                : "bg-zinc-200 text-zinc-900 hover:bg-zinc-300 dark:bg-zinc-800 dark:text-zinc-100 dark:hover:bg-zinc-700"
            )}
            key={filter.key}
            onClick={() => handleRemove(filter.paramKey, filter.paramValue)}
            type="button"
          >
            <span className="text-zinc-600 dark:text-zinc-400">
              {filter.facet}:
            </span>
            {hex !== undefined && (
              <span
                aria-hidden="true"
                className={cn(
                  "h-2 w-4 shrink-0",
                  !hex && "border border-zinc-300"
                )}
                style={hex ? { backgroundColor: hex } : undefined}
              />
            )}
            {filter.label}
            <span className="-my-1 -mr-1.5 flex p-1">
              <X className="size-4 shrink-0" strokeWidth={1.75} />
            </span>
            <span className="sr-only">Remove {filter.label} filter</span>
          </button>
        );
      })}
      <button
        className="ml-1 text-sm text-zinc-500 tracking-[0.24px] transition-colors hover:text-zinc-900 dark:hover:text-zinc-100"
        onClick={handleClearAll}
        type="button"
      >
        Clear all
      </button>
    </div>
  );
}
