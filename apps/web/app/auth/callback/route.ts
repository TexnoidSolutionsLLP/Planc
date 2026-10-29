import { NextResponse, type NextRequest } from "next/server";
import { completeEmailLink, safeRedirectPath } from "@sellly/auth";
import { appOrigin } from "@/lib/app-url";

/** Landing point for Supabase email links: sign-up confirmation and password reset. */
export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const next = safeRedirectPath(params.get("next"), "/");
  const ok = await completeEmailLink("web", params);
  return NextResponse.redirect(`${appOrigin()}${ok ? next : "/login?error=link"}`);
}
