import type { QueryCollectionByHandleResult } from "@workspace/sanity/types";

import { SanityImage } from "@/components/elements/sanity-image";
import { ProductHotspotsImage } from "@/components/product/product-hotspots";

type CollectionModules = NonNullable<
  NonNullable<QueryCollectionByHandleResult>["modules"]
>;
type CollectionModule = CollectionModules[number];

// Mirrors the URL validation on the `instagram` module schema
// (apps/studio/schemaTypes/objects/module/instagram.ts). Instagram's share
// button includes the username, so `/p/<id>` and `/<username>/p/<id>` are
// both valid; reels and IGTV embed the same way.
const INSTAGRAM_POST_ID =
  /instagram\.com\/(?:[^/?#]+\/)?(?:p|reel|tv)\/([^/?#&]+)/;

export function CollectionModuleRenderer({
  module,
}: {
  module: CollectionModule;
}) {
  switch (module._type) {
    case "callout":
      return (
        <div className="my-8 border bg-muted/50 p-6 text-center">
          <p className="text-lg">{module.text}</p>
        </div>
      );

    case "callToAction":
      return (
        <div className="my-8 border p-6">
          <h3 className="font-semibold text-xl">{module.title}</h3>
          {module.portableText && (
            <p className="mt-2 text-muted-foreground">{module.portableText}</p>
          )}
        </div>
      );

    case "image": {
      if (!module.id) return null;

      return (
        <div className="my-8 overflow-hidden rounded-lg">
          <SanityImage
            className="h-auto w-full"
            height={900}
            image={module}
            width={1600}
          />
        </div>
      );
    }

    case "imageWithProductHotspots":
      return (
        <div className="my-8">
          <ProductHotspotsImage
            image={module.image}
            productHotspots={module.productHotspots}
            showHotspots={module.showHotspots}
          />
        </div>
      );

    case "instagram": {
      const postId = module.url?.match(INSTAGRAM_POST_ID)?.[1];
      if (!postId) return null;

      return (
        <div className="my-8 flex justify-center">
          <iframe
            className="aspect-[4/5] w-full max-w-[540px] border-0"
            loading="lazy"
            src={`https://www.instagram.com/p/${postId}/embed`}
            title="Instagram post"
          />
        </div>
      );
    }

    default:
      return null;
  }
}
