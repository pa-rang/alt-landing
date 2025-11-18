import { NextResponse, type NextRequest } from "next/server";

import { isSupportedLocale } from "@/lib/i18n/config";
import { resolveLocale } from "@/lib/i18n/utils";

const PUBLIC_FILE = /\.[^\/]+$/;

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/favicon.ico") ||
    PUBLIC_FILE.test(pathname)
  ) {
    return NextResponse.next();
  }

  const segments = pathname.split("/").filter(Boolean);
  const localeFromPath = segments[0];

  // locale이 없거나 지원되지 않는 경우 기본 locale로 리다이렉트
  if (!isSupportedLocale(localeFromPath)) {
    const locale = resolveLocale({
      headerLocale: request.headers.get("accept-language"),
      cookieLocale: request.cookies.get("NEXT_LOCALE")?.value,
      country: request.headers.get("x-vercel-ip-country"),
    });

    const redirectUrl = new URL(`/${locale}${pathname}`, request.url);
    const response = NextResponse.redirect(redirectUrl);
    response.cookies.set("NEXT_LOCALE", locale, {
      path: "/",
      httpOnly: true,
      sameSite: "lax",
    });
    return response;
  }

  // 지원되는 locale인 경우 헤더에 설정하고 통과
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-next-locale", localeFromPath);

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (metadata files)
     */
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};
