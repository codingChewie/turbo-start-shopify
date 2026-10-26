"use client";

import {
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuTrigger,
} from "@workspace/ui/components/navigation-menu";
import Image from "next/image";
import Link from "next/link";

type CollectionLink = {
  _id: string;
  slug: string | null;
  store: {
    title: string | null;
    imageUrl: string | null;
  } | null;
};

type CollectionGroupDropdownProps = {
  _key: string;
  title: string | null;
  collectionLinks: CollectionLink[] | null;
  collectionProducts: {
    _id: string;
    slug: string | null;
    store: { title: string | null } | null;
  } | null;
  onNavigate: () => void;
};

export function CollectionGroupDropdown({
  _key,
  title,
  collectionLinks,
  collectionProducts,
  onNavigate,
}: CollectionGroupDropdownProps) {
  return (
    <NavigationMenuItem value={_key}>
      <NavigationMenuTrigger className="h-auto rounded-none bg-transparent px-3 py-2 font-medium text-muted-foreground text-sm hover:bg-transparent hover:text-foreground focus:bg-transparent data-[state=open]:bg-transparent data-[state=open]:focus:bg-transparent data-[state=open]:hover:bg-transparent">
        {title}
      </NavigationMenuTrigger>
      <NavigationMenuContent className="z-50 min-w-80 rounded-lg p-4 shadow-lg">
        <div className="grid gap-3">
          {collectionLinks?.map((collection) => {
            if (!collection.slug) return null;
            return (
              <Link
                className="flex items-center gap-3 rounded-md p-2 transition-colors hover:bg-accent"
                href={`/collections/${collection.slug}`}
                key={collection._id}
                onClick={onNavigate}
              >
                {collection.store?.imageUrl && (
                  <div className="relative size-10 shrink-0 overflow-hidden rounded-md bg-muted">
                    <Image
                      alt={collection.store.title ?? ""}
                      className="object-cover"
                      fill
                      sizes="40px"
                      src={collection.store.imageUrl}
                    />
                  </div>
                )}
                <span className="font-medium text-sm">
                  {collection.store?.title}
                </span>
              </Link>
            );
          })}
        </div>

        {collectionProducts?.slug && (
          <div className="mt-3 border-t pt-3">
            <Link
              className="text-muted-foreground text-sm transition-colors hover:text-foreground"
              href={`/collections/${collectionProducts.slug}`}
              onClick={onNavigate}
            >
              View all {collectionProducts.store?.title}
            </Link>
          </div>
        )}
      </NavigationMenuContent>
    </NavigationMenuItem>
  );
}
