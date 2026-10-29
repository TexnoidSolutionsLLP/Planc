import type { NextRequest } from "next/server";
import { updateSession } from "@sellly/auth/middleware";

export function middleware(request: NextRequest) {
  return updateSession(request, "admin");
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)"],
};
