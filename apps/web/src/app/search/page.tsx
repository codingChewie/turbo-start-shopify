import { Suspense } from "react";

import { SearchPageContent } from "@/components/search/search-page-content";
import { getSEOMetadata } from "@/lib/seo";

export async function generateMetadata() {
  return await getSEOMetadata({
    title: "Search",
    description: "Search our products",
    slug: "/search",
    seoNoIndex: true,
  });
}

type PageProps = {
  searchParams: Promise<Record<string, string>>;
};

export default function SearchPage({ searchParams }: PageProps) {
  return (
    <main className="site-container flex w-full flex-col py-12 md:py-20">
      <h1 className="sr-only">Search</h1>
      <Suspense>
        <SearchResults searchParams={searchParams} />
      </Suspense>
    </main>
  );
}

async function SearchResults({ searchParams }: PageProps) {
  const sp = await searchParams;
  return <SearchPageContent initialQuery={sp.q?.trim() ?? ""} />;
}
