import { NextRequest, NextResponse } from "next/server";
import { resolveStoreHost } from "@sellly/domains";

/**
 * Serves <slug>.<STOREFRONT_DOMAIN> as that store by rewriting it to
 * /<slug>/... internally, so every page lives at app/[store]/... The
 * storefront's own address (*.vercel.app, localhost, the bare domain) is served
 * by path instead: sellly-storefront.vercel.app/<slug>.
 *
 * Any other host is refused rather than guessed at. Merchants' own custom
 * domains aren't routed yet, so they land here too.
 */
export function middleware(req: NextRequest) {
  const target = resolveStoreHost(req.headers.get("host") ?? "");

  if (target.kind === "root") return NextResponse.next();
  if (target.kind === "unknown") return new NextResponse("Store not found", { status: 404 });

  const url = req.nextUrl.clone();
  const prefix = `/${target.slug}`;

  // Pages link to /<slug>/..., so those already carry the store.
  if (url.pathname === prefix || url.pathname.startsWith(`${prefix}/`)) return NextResponse.next();

  url.pathname = `${prefix}${url.pathname === "/" ? "" : url.pathname}`;
  return NextResponse.rewrite(url);
}

export const config = {
  matcher: ["/((?!_next|api|favicon.ico).*)"],
};
