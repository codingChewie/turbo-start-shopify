import { beforeEach, describe, expect, it, vi } from "vitest";

const { liveFetch, isEnabled } = vi.hoisted(() => ({
  liveFetch: vi.fn(),
  isEnabled: { value: false },
}));

vi.mock("server-only", () => ({}));
vi.mock("@workspace/sanity/live", () => ({ sanityFetch: liveFetch }));
vi.mock("next/headers", () => ({
  cookies: async () => ({}),
  draftMode: async () => ({ isEnabled: isEnabled.value }),
}));
vi.mock("next-sanity/live", () => ({
  resolvePerspectiveFromCookies: async () => undefined,
  resolveVariantFromCookies: async () => undefined,
}));

const { sanityFetch } = await import("@/lib/sanity");

describe("sanityFetch stega", () => {
  beforeEach(() => {
    liveFetch.mockReset();
    liveFetch.mockResolvedValue({ data: null });
  });

  it.each([undefined, true, false])(
    "stays off outside draft mode when the caller passes %s",
    async (stega) => {
      isEnabled.value = false;
      await sanityFetch({ query: "q", stega: stega as false });
      expect(liveFetch).toHaveBeenCalledWith(
        expect.objectContaining({ perspective: "published", stega: false })
      );
    }
  );

  it.each([
    [undefined, true],
    [true, true],
    [false, false],
  ])("in draft mode, a caller passing %s gets %s", async (stega, expected) => {
    isEnabled.value = true;
    await sanityFetch({ query: "q", stega: stega as false });
    expect(liveFetch).toHaveBeenCalledWith(
      expect.objectContaining({ perspective: "drafts", stega: expected })
    );
  });
});
