"use client";

import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@workspace/ui/components/navigation-menu";
import Link from "next/link";
import { useState } from "react";

import type { ColumnLink, NavColumn, NavigationData } from "@/types";
import { CartDrawer } from "./cart/cart-drawer";
import { CartToggle } from "./cart/cart-toggle";
import { MenuLink } from "./elements/menu-link";
import { Logo } from "./logo";
import { MobileMenu } from "./mobile-menu";
import { CollectionGroupDropdown } from "./nav/collection-group-dropdown";
import { SavedItemsDrawer } from "./saved-items/saved-items-drawer";
import { SavedItemsToggle } from "./saved-items/saved-items-toggle";
import { SearchToggle } from "./search/search-toggle";

function DesktopColumnDropdown({
  column,
  onNavigate,
}: {
  column: Extract<NavColumn, { type: "column" }>;
  onNavigate: () => void;
}) {
  return (
    <NavigationMenuItem value={column._key}>
      <NavigationMenuTrigger className="h-auto rounded-none bg-transparent px-0 py-2 font-medium text-sm tracking-[0.02em] hover:bg-transparent focus:bg-transparent data-[state=open]:bg-transparent data-[state=open]:focus:bg-transparent data-[state=open]:hover:bg-transparent">
        {column.title}
      </NavigationMenuTrigger>
      <NavigationMenuContent className="z-50 min-w-70 rounded-lg p-2 shadow-lg">
        <div className="grid gap-1">
          {column.links?.map((link: ColumnLink) => (
            <MenuLink
              description={link.description || ""}
              href={link.href || ""}
              icon={link.icon}
              key={link._key}
              name={link.name || ""}
              onClick={onNavigate}
            />
          ))}
        </div>
      </NavigationMenuContent>
    </NavigationMenuItem>
  );
}

function DesktopColumnLink({
  column,
}: {
  column: Extract<NavColumn, { type: "link" }>;
}) {
  if (!column.href) return null;

  return (
    <NavigationMenuItem>
      <Link
        className="py-2 font-medium text-sm tracking-[0.02em] transition-colors hover:text-foreground"
        href={column.href}
      >
        {column.name}
      </Link>
    </NavigationMenuItem>
  );
}

export function Navbar({ navbarData, settingsData }: NavigationData) {
  const { columns } = navbarData || {};
  const { siteTitle, logo } = settingsData || {};
  const [openMenu, setOpenMenu] = useState("");
  const closeMenu = () => setOpenMenu("");

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-white dark:bg-black">
      <div className="site-container">
        <div className="flex h-10 items-center justify-between">
          {/* Desktop Navigation */}
          <NavigationMenu
            className="hidden max-w-none justify-start lg:flex"
            delayDuration={0}
            onValueChange={setOpenMenu}
            value={openMenu}
            viewport={false}
          >
            <NavigationMenuList className="justify-start gap-6">
              {columns?.map((column) => {
                if (column.type === "column") {
                  return (
                    <DesktopColumnDropdown
                      column={column}
                      key={column._key}
                      onNavigate={closeMenu}
                    />
                  );
                }
                if (column.type === "link") {
                  return (
                    <DesktopColumnLink column={column} key={column._key} />
                  );
                }
                if (column.type === "collectionGroup") {
                  const cg = column as Extract<
                    NavColumn,
                    { type: "collectionGroup" }
                  >;
                  return (
                    <CollectionGroupDropdown
                      _key={cg._key}
                      collectionLinks={cg.collectionLinks ?? null}
                      collectionProducts={cg.collectionProducts ?? null}
                      key={cg._key}
                      onNavigate={closeMenu}
                      title={cg.title ?? null}
                    />
                  );
                }
                return null;
              })}
            </NavigationMenuList>
          </NavigationMenu>

          {/* Logo */}
          <div className="flex h-10 items-center">
            <Logo logo={logo} text={siteTitle} />
          </div>

          {/* Desktop Actions */}
          <div className="hidden flex-1 items-center justify-end gap-6 lg:flex">
            <SavedItemsToggle variant="text" />
            <SearchToggle />
            <CartToggle />
          </div>

          {/* Mobile Actions */}
          <div className="flex items-center gap-4 lg:hidden">
            <SearchToggle />
            <SavedItemsToggle />
            <CartToggle />
            <MobileMenu navbarData={navbarData} settingsData={settingsData} />
          </div>
        </div>
      </div>

      <CartDrawer />
      <SavedItemsDrawer />
    </header>
  );
}
