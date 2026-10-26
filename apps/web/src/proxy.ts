import { client } from "@workspace/sanity/client";
import {
  queryBlogPaths,
  queryCollectionPaths,
  queryProductPaths,
  querySlugPagePaths,
} from "@workspace/sanity/query";
import { type NextRequest, NextResponse } from "next/server";

import { normalizeMarkdownPath, prefersMarkdown } from "@/lib/markdown/path";

const APP_ROUTES = new Set([
  "/",
  "/blog",
  "/cart",
  "/collections",
  "/search",
  "/og-preview",
]);

let known: { at: number; paths: Set<string> } | null = null;

async function knownPaths(maxAgeMs: number) {
  if (known && Date.now() - known.at < maxAgeMs) return known.paths;
  const [products, collections, blogs, pages] = await Promise.all([
    client.fetch(queryProductPaths),
    client.fetch(queryCollectionPaths),
    client.fetch(queryBlogPaths),
    client.fetch(querySlugPagePaths),
  ]);
  known = {
    at: Date.now(),
    paths: new Set([
      ...products.map((handle) => `/products/${handle}`),
      ...collections.map((handle) => `/collections/${handle}`),
      ...blogs,
      ...pages,
    ]),
  };
  return known.paths;
}

async function isKnownPath(pathname: string) {
  if (APP_ROUTES.has(pathname) || pathname.split("/").pop()?.includes(".")) {
    return true;
  }
  try {
    return (
      (await knownPaths(60_000)).has(pathname) ||
      (await knownPaths(10_000)).has(pathname)
    );
  } catch {
    return true;
  }
}

/**
 * Content negotiation for AI agents. A request that either ends in `.md` or
 * prefers `Accept: text/markdown` is rewritten to the `/api/markdown` route,
 * which serves a Markdown representation of the same content a browser would
 * get as HTML. Any other request for a path no route or Sanity document
 * answers to is returned as a 404.
 *
 * Next.js 16's `proxy` convention (the former `middleware`).
 */
export async function proxy(request: NextRequest): Promise<NextResponse> {
  if (request.method !== "GET" && request.method !== "HEAD") {
    return NextResponse.next();
  }

  const { pathname } = request.nextUrl;
  const hasMdSuffix = pathname.endsWith(".md");
  const wantsMarkdown =
    hasMdSuffix || prefersMarkdown(request.headers.get("accept") ?? "");

  if (!wantsMarkdown) {
    return request.cookies.has("__prerender_bypass") ||
      (await isKnownPath(pathname))
      ? NextResponse.next()
      : NextResponse.rewrite(request.nextUrl, { status: 404 });
  }

  const rawPath = hasMdSuffix ? pathname.slice(0, -3) : pathname;

  // Header-only negotiation must not hijack asset files (e.g. a `.png` fetched
  // with a broad `Accept`). The explicit `.md` suffix has no such ambiguity.
  const lastSegment = rawPath.split("/").pop() ?? "";
  if (!hasMdSuffix && lastSegment.includes(".")) {
    return NextResponse.next();
  }

  const contentPath = normalizeMarkdownPath(rawPath);

  // A rewrite's query params aren't reliably readable downstream, but request
  // headers are — so forward the path via both.
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-markdown-path", contentPath);

  const url = request.nextUrl.clone();
  url.pathname = "/api/markdown";
  url.search = "";
  url.searchParams.set("path", contentPath);
  return NextResponse.rewrite(url, { request: { headers: requestHeaders } });
}

export const config = {
  matcher: [
    "/((?!api/|_next/|favicon.ico|robots.txt|sitemap.xml|llms\\.txt|opengraph.png).*)",
  ],
};
