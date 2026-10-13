import { Suspense } from "react";

import { SearchModal } from "@/components/search/search-modal";

type PageProps = {
  searchParams: Promise<Record<string, string>>;
};

export default function SearchModalPage({ searchParams }: PageProps) {
  return (
    <Suspense>
      <SearchModalFromUrl searchParams={searchParams} />
    </Suspense>
  );
}

async function SearchModalFromUrl({ searchParams }: PageProps) {
  const sp = await searchParams;
  return <SearchModal initialQuery={sp.q?.trim() ?? ""} />;
}
