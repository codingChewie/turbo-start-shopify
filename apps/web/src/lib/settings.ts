"use cache";

import { client } from "@workspace/sanity/client";
import { querySettingsData } from "@workspace/sanity/query";

export async function fetchSettings() {
  // `stega: false` is load-bearing: these land in `<title>` and `og:title`,
  // which no overlay decodes. An 11-char title measured 915 chars with it on.
  return await client.fetch(querySettingsData, {}, { stega: false });
}
