import { NextResponse } from "next/server";

import { storefrontQuery } from "@/lib/shopify/client";
import { SEARCH_PRODUCTS_QUERY } from "@/lib/shopify/queries";
import type { SearchProductsResponse } from "@/lib/shopify/types";

const LIMIT = 24;

const EMPTY = { products: [], totalCount: 0 };

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q")?.trim() ?? "";

  if (!query) {
    return NextResponse.json(EMPTY);
  }

  const result = await storefrontQuery<SearchProductsResponse>(
    SEARCH_PRODUCTS_QUERY,
    { variables: { query, first: LIMIT } }
  );

  if (!result.ok) {
    return NextResponse.json(EMPTY, { status: 500 });
  }

  return NextResponse.json({
    products: result.data.search.edges.map((edge) => edge.node),
    totalCount: result.data.search.totalCount,
  });
}
