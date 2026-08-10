import { PortableText, type PortableTextReactComponents } from "next-sanity";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

// The hotspot image reaches `@workspace/env/client`, which validates the Sanity
// env at import time. Nothing on the accordion path needs it.
vi.mock("@/components/product/product-hotspots", () => ({
  ProductHotspotsImage: () => null,
}));

// Radix keeps a closed panel out of the markup entirely, so the group body
// would never appear. The shell is not what is under test — the content of the
// nested render is.
vi.mock("@workspace/ui/components/accordion", () => ({
  Accordion: ({ children }: { children?: unknown }) =>
    createElement("div", null, children as never),
  AccordionItem: ({ children }: { children?: unknown }) =>
    createElement("div", null, children as never),
  AccordionTrigger: ({ children }: { children?: unknown }) =>
    createElement("div", null, children as never),
  AccordionContent: ({ children }: { children?: unknown }) =>
    createElement("div", null, children as never),
}));

import { createSharedPortableTextTypes } from "@/components/elements/portable-text-types";

/**
 * A link inside an accordion group is rendered by a second, nested
 * `<PortableText>`. `@portabletext/react` resolves components per render call,
 * so a nested render that is passed nothing inherits nothing and the mark falls
 * back to plain text.
 */
const accordionWithLink = [
  {
    _type: "accordion",
    _key: "acc",
    groups: [
      {
        _key: "group",
        title: "Shipping",
        body: [
          {
            _type: "block",
            _key: "block",
            style: "normal",
            markDefs: [
              {
                _type: "customLink",
                _key: "link",
                href: "/collections/shirts",
              },
            ],
            children: [
              {
                _type: "span",
                _key: "span",
                text: "See shirts",
                marks: ["link"],
              },
            ],
          },
        ],
      },
    ],
  },
];

// Stands in for the real link components, which pull in `next/link`. The
// assertion is about whether the nested render receives any marks at all.
const components: Partial<PortableTextReactComponents> = {
  marks: {
    customLink: ({ children, value }) =>
      createElement("a", { href: value?.href }, children),
  },
  types: {},
};
components.types = createSharedPortableTextTypes(() => components);

describe("createSharedPortableTextTypes", () => {
  it("renders a link inside an accordion group with its href", () => {
    const html = renderToStaticMarkup(
      createElement(PortableText, { components, value: accordionWithLink })
    );

    expect(html).toContain('href="/collections/shirts"');
    expect(html).toContain("See shirts");
  });

  it("keeps the group title", () => {
    const html = renderToStaticMarkup(
      createElement(PortableText, { components, value: accordionWithLink })
    );

    expect(html).toContain("Shipping");
  });
});
