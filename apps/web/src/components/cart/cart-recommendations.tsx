"use client";

import { Skeleton } from "@workspace/ui/components/skeleton";
import { useQuery } from "@tanstack/react-query";

import { ProductCard } from "@/components/product/product-card";
import { getColorHex } from "@/lib/shopify/color";
import { getCardOptions } from "@/lib/shopify/options";
import { badgeFromTags, secondaryImageUrl } from "@/lib/shopify/product-card";
import { type FeaturedProduct, LOW_STOCK_THRESHOLD } from "@/lib/shopify/types";

async function fetchFeaturedProducts(): Promise<FeaturedProduct[]> {
  const res = await fetch("/api/featured-products");
  if (!res.ok) return [];
  const data: { products: FeaturedProduct[] } = await res.json();
  return data.products;
}

function stockStatus(product: FeaturedProduct) {
  if (!product.availableForSale) return "out" as const;
  if (
    product.totalInventory !== null &&
    product.totalInventory > 0 &&
    product.totalInventory <= LOW_STOCK_THRESHOLD
  ) {
    return "low" as const;
  }
  return null;
}

export function CartRecommendations() {
  const { data: products = [], isLoading } = useQuery({
    queryKey: ["featured-products"],
    queryFn: fetchFeaturedProducts,
    staleTime: 5 * 60 * 1000,
  });

  if (isLoading) {
    return (
      <div className="-mr-8 flex gap-4 overflow-hidden">
        {["a", "b"].map((key) => (
          <div className="w-[340px] shrink-0" key={key}>
            <Skeleton className="aspect-56/75 w-full" />
            <Skeleton className="mt-3 h-4 w-3/4" />
            <Skeleton className="mt-2 h-4 w-1/2" />
          </div>
        ))}
      </div>
    );
  }

  if (products.length === 0) return null;

  return (
    <div className="-mr-8 flex gap-4 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {products.map((product) => {
        const { colors: colorNames, sizes } = getCardOptions(product.options);
        const colors = colorNames.map((name) => ({
          name,
          hex: getColorHex(name),
        }));
        return (
          <div className="w-[340px] shrink-0" key={product.id}>
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
              stockStatus={stockStatus(product)}
              title={product.title}
              variantName={colorNames[0]}
              variants={product.variants.edges.map((edge) => edge.node)}
              vendor={product.vendor}
            />
          </div>
        );
      })}
    </div>
  );
}
