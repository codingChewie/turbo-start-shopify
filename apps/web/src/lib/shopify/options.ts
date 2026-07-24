import type { ShopifyProductOption } from "./types";

/** Option names that render as color swatches. */
const COLOR_OPTION_NAMES = new Set(["color", "colour"]);

/** Option names that render as size choices. */
const SIZE_OPTION_NAMES = new Set(["size"]);

export function getOptionType(name: string): "color" | "size" | "default" {
  const lower = name.toLowerCase();
  if (COLOR_OPTION_NAMES.has(lower)) return "color";
  if (SIZE_OPTION_NAMES.has(lower)) return "size";
  return "default";
}

/** Splits product options into color and size value lists for card display. */
export function getCardOptions(options: ShopifyProductOption[]): {
  colors: string[];
  sizes: string[];
} {
  let colors: string[] = [];
  let sizes: string[] = [];
  for (const option of options) {
    const type = getOptionType(option.name);
    if (type === "color") {
      colors = option.values;
    } else if (type === "size") {
      sizes = option.values;
    }
  }
  return { colors, sizes };
}
