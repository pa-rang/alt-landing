import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

import { isSupportedLocale } from "@/lib/i18n/config";
import { resolveLocale } from "@/lib/i18n/utils";

const PUBLIC_FILE = /\.[^\/]+$/;

export async function middleware(request: NextRequest) {
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

  // 지원되는 locale인 경우 헤더에 설정
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-next-locale", localeFromPath);

  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });

  // Supabase 세션 갱신 (권장 패턴)
  // 매 요청마다 세션을 갱신하여 refresh_token_not_found 에러 방지
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  // 세션 갱신 시도 - 에러가 나도 무시 (미로그인 상태일 수 있음)
  await supabase.auth.getUser();

  return response;
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
