import "server-only";

import { sanityFetch as liveFetch } from "@workspace/sanity/live";
import { cookies, draftMode } from "next/headers";
import {
  resolvePerspectiveFromCookies,
  resolveVariantFromCookies,
} from "next-sanity/live";

type FetchOptions = Parameters<typeof liveFetch>[0];

async function previewOptions(): Promise<Partial<FetchOptions>> {
  if (!(await draftMode()).isEnabled) {
    return { perspective: "published", stega: false };
  }
  const jar = await cookies();
  return {
    perspective:
      (await resolvePerspectiveFromCookies({ cookies: jar })) ?? "drafts",
    variant: await resolveVariantFromCookies({ cookies: jar }),
    stega: true,
  };
}

async function cachedFetch(options: FetchOptions) {
  "use cache";
  return liveFetch(options);
}

export const sanityFetch = (async (options: FetchOptions) => {
  const preview = await previewOptions();
  return cachedFetch({
    ...preview,
    ...options,
    stega: preview.stega && options.stega !== false,
  });
}) as typeof liveFetch;
