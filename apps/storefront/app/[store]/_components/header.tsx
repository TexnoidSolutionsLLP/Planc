"use client";

import Link from "next/link";
import { ShoppingBag, Search } from "lucide-react";
import type { HeaderVariant } from "@sellly/theme";
import { useCart } from "@/lib/cart-context";

export function StorefrontHeader({
  storeName,
  storeSlug,
  logoUrl,
  supportEmail,
  variant,
  shopLabel,
  uppercase,
  portfolio,
}: {
  storeName: string;
  storeSlug: string;
  logoUrl?: string | null;
  supportEmail?: string | null;
  variant: HeaderVariant;
  shopLabel: string;
  uppercase?: boolean;
  portfolio?: boolean;
}) {
  const { count, setOpen } = useCart();
  const navText = uppercase ? "text-[11px] font-medium uppercase tracking-[0.18em]" : "text-small font-medium";

  const logo = (
    <Link href={`/${storeSlug}`} className="flex items-center gap-2">
      {logoUrl ? (
        <img src={logoUrl} alt={storeName} className="h-8 w-8 rounded-sm object-cover" />
      ) : (
        <span className="sf-heading truncate text-[20px] leading-none text-primary">{storeName}</span>
      )}
    </Link>
  );

  const nav = (
    <nav aria-label="Main" className={`flex items-center gap-5 text-primary ${navText}`}>
      <Link href={`/${storeSlug}`} className="transition-colors hover:text-accent">
        Home
      </Link>
      <Link href={`/${storeSlug}/search`} className="transition-colors hover:text-accent">
        {shopLabel}
      </Link>
      {portfolio && supportEmail && (
        <a href={`mailto:${supportEmail}`} className="transition-colors hover:text-accent">
          Contact
        </a>
      )}
    </nav>
  );

  const actions = (
    <div className="flex items-center justify-end gap-4">
      <Link href={`/${storeSlug}/search`} aria-label="Search" className="text-primary transition-colors hover:text-accent">
        <Search className="h-[18px] w-[18px]" />
      </Link>
      <button aria-label="Open cart" className="relative text-primary transition-colors hover:text-accent" onClick={() => setOpen(true)}>
        <ShoppingBag className="h-[18px] w-[18px]" />
        {count > 0 && (
          <span className="absolute -right-2 -top-2 flex h-4 w-4 items-center justify-center rounded-full bg-accent text-[10px] font-medium text-white">
            {count}
          </span>
        )}
      </button>
    </div>
  );

  const shell = "sticky top-0 z-40 border-b border-border bg-surface/90 backdrop-blur";

  if (variant === "center") {
    return (
      <header className={shell}>
        <div className="mx-auto grid h-16 max-w-6xl grid-cols-[1fr_auto_1fr] items-center gap-3 px-4">
          <div className="hidden sm:block">{nav}</div>
          <div className="col-start-2 justify-self-center sm:col-start-2">{logo}</div>
          <div className="col-start-3">{actions}</div>
        </div>
        <div className="border-t border-border px-4 py-2 sm:hidden">
          <div className="flex justify-center">{nav}</div>
        </div>
      </header>
    );
  }

  if (variant === "stacked") {
    return (
      <header className={shell}>
        <div className="mx-auto grid max-w-6xl grid-cols-[1fr_auto_1fr] items-center gap-3 px-4 pb-3 pt-4">
          <span aria-hidden="true" />
          <div className="justify-self-center [&_span]:text-[26px]">{logo}</div>
          {actions}
        </div>
        <div className="flex justify-center border-t border-border py-2.5">{nav}</div>
      </header>
    );
  }

  return (
    <header className={shell}>
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4">
        {logo}
        <div className="ml-auto mr-2 hidden sm:block">{nav}</div>
        {actions}
      </div>
      <div className="border-t border-border px-4 py-2 sm:hidden">{nav}</div>
    </header>
  );
}
