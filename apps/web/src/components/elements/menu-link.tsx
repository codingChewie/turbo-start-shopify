import { cn } from "@workspace/ui/lib/utils";
import Link from "next/link";
import type { ComponentProps } from "react";

import type { MenuLinkProps } from "@/types";
import { SanityIcon } from "./sanity-icon";

export function MenuLink({
  name,
  href,
  description,
  icon,
  className,
  ...props
}: MenuLinkProps & Omit<ComponentProps<typeof Link>, keyof MenuLinkProps>) {
  if (!href) return null;

  return (
    <Link
      {...props}
      className={cn(
        className,
        "group flex flex-row items-start gap-3 rounded-lg p-3 text-base transition-colors hover:bg-accent"
      )}
      href={href}
      prefetch
    >
      {icon && (
        <SanityIcon
          className="mt-0.5 size-4 shrink-0 text-muted-foreground"
          icon={icon}
        />
      )}
      <div className="grid gap-1">
        <div className="font-medium leading-none group-hover:text-accent-foreground">
          {name}
        </div>
        {description && (
          <div className="line-clamp-2 text-muted-foreground text-sm">
            {description}
          </div>
        )}
      </div>
    </Link>
  );
}
