import type {
  CardVariant,
  MerchBadge,
  ProductCardProps,
  StockStatus,
} from "@/components/product/product-card";
import { getColorHex } from "./color";
import { getCardOptions, getOptionType } from "./options";
import {
  type CardSourceProduct,
  type Connection,
  LOW_STOCK_THRESHOLD,
  type ShopifyImage,
} from "./types";

/** Derives the merch badge from Shopify product tags. */
export function badgeFromTags(tags: string[]): MerchBadge | null {
  const lower = tags.map((tag) => tag.toLowerCase());
  if (lower.includes("new")) return "new";
  if (lower.includes("online-exclusive") || lower.includes("exclusive")) {
    return "exclusive";
  }
  return null;
}

/**
 * Second product image for the card hover cross-fade: the first image that
 * differs from the featured image (else the 2nd image), or null.
 */
export function secondaryImageUrl(
  images: Connection<ShopifyImage> | undefined,
  featuredUrl: string | null
): string | null {
  const urls = (images?.edges ?? []).map((edge) => edge.node.url);
  return urls.find((url) => url !== featuredUrl) ?? urls[1] ?? null;
}

/** The variant's value for the color- or size-typed option, if it has one. */
function optionValue(variant: CardVariant, type: "color" | "size") {
  return variant.selectedOptions.find(
    (option) => getOptionType(option.name) === type
  )?.value;
}

/**
 * Finds the variant matching the card's color and size selection. Matches per
 * option type rather than on bare values, so a color and a size sharing a value
 * string can't cross-match.
 */
export function findCardVariant(
  variants: CardVariant[] | undefined,
  color: string | undefined,
  size: string | undefined
): CardVariant | undefined {
  if (!variants || variants.length === 0) return undefined;
  return variants.find(
    (variant) =>
      (!color || optionValue(variant, "color") === color) &&
      (!size || optionValue(variant, "size") === size)
  );
}

/**
 * Card images for the current color: that color's variant photo, plus the next
 * gallery image as the hover cross-fade partner (Shopify orders product images
 * in per-color groups). Falls back to the product-level pair whenever the color
 * has no photo of its own.
 */
export function resolveCardImages({
  selectedColor,
  variants,
  galleryUrls,
  imageUrl,
  secondaryImageUrl: productSecondary,
}: {
  selectedColor: string | undefined;
  variants: CardVariant[] | undefined;
  galleryUrls: string[] | undefined;
  imageUrl: string | null;
  secondaryImageUrl: string | null | undefined;
}): { primary: string | null; secondary: string | null } {
  const fallback = { primary: imageUrl, secondary: productSecondary ?? null };
  if (!selectedColor || !variants || variants.length === 0) return fallback;

  const primary = variants.find(
    (variant) =>
      optionValue(variant, "color") === selectedColor && variant.image?.url
  )?.image?.url;
  if (!primary) return fallback;

  const gallery = galleryUrls ?? [];
  const index = gallery.indexOf(primary);
  // Variant photo outside the fetched gallery window — keep the product hover.
  if (index === -1) return { primary, secondary: fallback.secondary };

  const next = gallery[index + 1] ?? null;
  if (!next) return { primary, secondary: null };

  // If the next image opens another color's group, this color has a single
  // photo — better no cross-fade than fading into the wrong color.
  const opensAnotherColor = variants.some(
    (variant) =>
      variant.image?.url === next &&
      optionValue(variant, "color") !== selectedColor
  );
  return { primary, secondary: opensAnotherColor ? null : next };
}

/**
 * Stock badge for a card. Prefers the product-level fields the featured/card
 * queries select, falling back to the first variant's inventory.
 */
function cardStockStatus(product: CardSourceProduct): StockStatus {
  if (product.availableForSale === false) return "out";
  if (product.totalInventory !== undefined) {
    if (
      product.totalInventory !== null &&
      product.totalInventory > 0 &&
      product.totalInventory <= LOW_STOCK_THRESHOLD
    ) {
      return "low";
    }
    return null;
  }

  const variant = product.variants.edges[0]?.node;
  if (!variant?.availableForSale) return "out";
  if (
    variant.quantityAvailable !== null &&
    variant.quantityAvailable > 0 &&
    variant.quantityAvailable <= LOW_STOCK_THRESHOLD
  ) {
    return "low";
  }
  return null;
}

/** Maps a Storefront collection product to canonical ProductCard props. */
export function collectionProductToCardProps(
  product: CardSourceProduct
): ProductCardProps {
  const compareAt = product.compareAtPriceRange?.minVariantPrice.amount;
  const {
    colors: colorNames,
    sizes,
    colorOptionName,
  } = getCardOptions(product.options ?? []);
  const colors = colorNames.map((name) => ({ name, hex: getColorHex(name) }));
  const galleryUrls = (product.images?.edges ?? []).map(
    (edge) => edge.node.url
  );

  return {
    slug: product.handle,
    title: product.title,
    vendor: product.vendor,
    imageUrl: product.featuredImage?.url ?? null,
    secondaryImageUrl: secondaryImageUrl(
      product.images,
      product.featuredImage?.url ?? null
    ),
    currencyCode: product.priceRange.minVariantPrice.currencyCode,
    priceRange: {
      minVariantPrice: Number(product.priceRange.minVariantPrice.amount),
      maxVariantPrice: Number(product.priceRange.maxVariantPrice.amount),
    },
    compareAtPrice: compareAt ? Number(compareAt) : null,
    stockStatus: cardStockStatus(product),
    badge: badgeFromTags(product.tags ?? []),
    variantName: colorNames[0] ?? null,
    colors,
    selectedColor: colorNames[0],
    colorOptionName,
    sizes,
    selectedSize: sizes[0],
    variants: (product.variants?.edges ?? []).map((edge) => edge.node),
    galleryUrls,
  };
}
