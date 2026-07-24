import { Button } from "@workspace/ui/components/button";
import Link from "next/link";

import {
  ProductCard,
  type StockStatus,
} from "@/components/product/product-card";
import { storefrontQuery } from "@/lib/shopify/client";
import { getColorHex } from "@/lib/shopify/color";
import { getCardOptions } from "@/lib/shopify/options";
import { badgeFromTags, secondaryImageUrl } from "@/lib/shopify/product-card";
import { FEATURED_PRODUCTS_QUERY } from "@/lib/shopify/queries";
import {
  type FeaturedProduct,
  type FeaturedProductsResponse,
  LOW_STOCK_THRESHOLD,
} from "@/lib/shopify/types";

/** Fetches featured products from Shopify Storefront API. */
async function getFeaturedProducts(): Promise<FeaturedProduct[]> {
  const result = await storefrontQuery<FeaturedProductsResponse>(
    FEATURED_PRODUCTS_QUERY,
    { variables: { first: 4 } }
  );

  if (!result.ok) return [];
  return result.data.products.edges.map((edge) => edge.node);
}

function featuredStock(product: FeaturedProduct): StockStatus {
  if (!product.availableForSale) return "out";
  if (
    product.totalInventory !== null &&
    product.totalInventory > 0 &&
    product.totalInventory <= LOW_STOCK_THRESHOLD
  ) {
    return "low";
  }
  return null;
}

export async function FeaturedProducts() {
  const products = await getFeaturedProducts();

  if (products.length === 0) return null;

  return (
    <section className="site-container py-12 md:py-20">
      <div className="mb-8 flex items-end justify-between">
        <h2 className="font-medium text-3xl tracking-tight md:text-4xl">
          Featured Products
        </h2>
        <Button asChild size="sm" variant="default">
          <Link href="/collections/all-products">Shop All</Link>
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-1 md:grid-cols-4">
        {products.map((product) => {
          const { colors: colorNames, sizes } = getCardOptions(product.options);
          const colors = colorNames.map((name) => ({
            name,
            hex: getColorHex(name),
          }));
          return (
            <ProductCard
              badge={badgeFromTags(product.tags)}
              colors={colors}
              compareAtPrice={
                product.compareAtPriceRange
                  ? Number(product.compareAtPriceRange.minVariantPrice.amount)
                  : null
              }
              currencyCode={product.priceRange.minVariantPrice.currencyCode}
              imageUrl={product.featuredImage?.url ?? null}
              key={product.id}
              secondaryImageUrl={secondaryImageUrl(
                product.images,
                product.featuredImage?.url ?? null
              )}
              priceRange={{
                minVariantPrice: Number(
                  product.priceRange.minVariantPrice.amount
                ),
                maxVariantPrice: Number(
                  product.priceRange.maxVariantPrice.amount
                ),
              }}
              selectedColor={colorNames[0]}
              selectedSize={sizes[0]}
              sizes={sizes}
              slug={product.handle}
              stockStatus={featuredStock(product)}
              title={product.title}
              variantName={colorNames[0]}
              variants={product.variants.edges.map((edge) => edge.node)}
              vendor={product.vendor}
            />
          );
        })}
      </div>
    </section>
  );
}
