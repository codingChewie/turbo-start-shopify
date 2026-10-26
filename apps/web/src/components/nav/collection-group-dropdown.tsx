"use client";

import {
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
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
};

export function CollectionGroupDropdown({
  _key,
  title,
  collectionLinks,
  collectionProducts,
}: CollectionGroupDropdownProps) {
  return (
    <NavigationMenuItem value={_key}>
      <NavigationMenuTrigger className="h-auto rounded-none bg-transparent px-3 py-2 text-muted-foreground hover:bg-transparent hover:text-foreground focus:bg-transparent data-[state=open]:bg-transparent data-[state=open]:text-foreground data-[state=open]:focus:bg-transparent data-[state=open]:hover:bg-transparent">
        {title}
      </NavigationMenuTrigger>
      <NavigationMenuContent className="z-50 min-w-80 p-4 group-data-[viewport=false]/navigation-menu:rounded-lg group-data-[viewport=false]/navigation-menu:shadow-lg">
        <div className="grid gap-3">
          {collectionLinks?.map((collection) => {
            if (!collection.slug) return null;
            return (
              <NavigationMenuLink
                asChild
                className="flex-row items-center gap-3 rounded-md"
                key={collection._id}
              >
                <Link href={`/collections/${collection.slug}`}>
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
              </NavigationMenuLink>
            );
          })}
        </div>

        {collectionProducts?.slug && (
          <div className="mt-3 border-t pt-3">
            <NavigationMenuLink
              asChild
              className="p-0 text-muted-foreground hover:bg-transparent hover:text-foreground focus:bg-transparent focus:text-foreground"
            >
              <Link href={`/collections/${collectionProducts.slug}`}>
                View all {collectionProducts.store?.title}
              </Link>
            </NavigationMenuLink>
          </div>
        )}
      </NavigationMenuContent>
    </NavigationMenuItem>
  );
}
