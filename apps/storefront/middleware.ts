import { NextRequest, NextResponse } from "next/server";

const ROOT_DOMAINS = ["sellly.app", "localhost:3001", "localhost"];

/**
 * Resolves store-name.sellly.app → /store-name/... internally, so every page
 * lives at app/[store]/... and can also be hit directly by path in dev
 * (localhost:3001/store-name) without needing wildcard DNS locally.
 */
export function middleware(req: NextRequest) {
  const host = req.headers.get("host") ?? "";
  const isRootDomain = ROOT_DOMAINS.some((d) => host === d || host.endsWith(`.vercel.app`));

  if (isRootDomain) return NextResponse.next();

  const subdomain = host.split(".")[0];
  const url = req.nextUrl.clone();

  if (!url.pathname.startsWith(`/${subdomain}`)) {
    url.pathname = `/${subdomain}${url.pathname === "/" ? "" : url.pathname}`;
    return NextResponse.rewrite(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next|api|favicon.ico).*)"],
};
