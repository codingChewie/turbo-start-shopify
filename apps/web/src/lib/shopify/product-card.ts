import type {
  MerchBadge,
  ProductCardProps,
  StockStatus,
} from "@/components/product/product-card";
import { getColorHex } from "./color";
import { getCardOptions } from "./options";
import {
  type Connection,
  LOW_STOCK_THRESHOLD,
  type ShopifyCollectionProduct,
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

/** Maps a Storefront collection product to canonical ProductCard props. */
export function collectionProductToCardProps(
  product: ShopifyCollectionProduct
): ProductCardProps {
  const variant = product.variants.edges[0]?.node;

  let stockStatus: StockStatus = null;
  if (!variant?.availableForSale) {
    stockStatus = "out";
  } else if (
    variant.quantityAvailable !== null &&
    variant.quantityAvailable > 0 &&
    variant.quantityAvailable <= LOW_STOCK_THRESHOLD
  ) {
    stockStatus = "low";
  }

  const compareAt = product.compareAtPriceRange?.minVariantPrice.amount;
  const { colors: colorNames, sizes } = getCardOptions(product.options ?? []);
  const colors = colorNames.map((name) => ({ name, hex: getColorHex(name) }));

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
    stockStatus,
    badge: badgeFromTags(product.tags ?? []),
    variantName: colorNames[0] ?? null,
    colors,
    selectedColor: colorNames[0],
    sizes,
    selectedSize: sizes[0],
    variants: (product.variants?.edges ?? []).map((edge) => edge.node),
  };
}
