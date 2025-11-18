import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

// Supabase Service Role Client (Admin SDK)
const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

/**
 * Authorization 헤더에서 Bearer 토큰 추출
 */
function extractBearerToken(authHeader: string | null): string | null {
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }
  return authHeader.substring(7).trim();
}

/**
 * Magic Link 생성 엔드포인트
 * 네이티브 클라이언트가 Supabase access_token을 사용하여 Magic Link를 받아
 * 웹의 /pricing 페이지로 자동 로그인할 수 있도록 합니다.
 */
export async function POST(request: Request) {
  try {
    // 1. 요청 본문 파싱
    const body = await request.json().catch(() => ({}));
    const clientRedirectTo = typeof body.redirect_to === "string" ? body.redirect_to : null;

    // 2. Authorization 헤더에서 토큰 추출
    const authHeader = request.headers.get("authorization");
    const accessToken = extractBearerToken(authHeader);

    if (!accessToken) {
      return NextResponse.json({ error: "no_token" }, { status: 401 });
    }

    // 3. 토큰 검증 및 유저 정보 조회
    const {
      data: { user },
      error: userError,
    } = await supabaseAdmin.auth.getUser(accessToken);

    if (userError || !user) {
      return NextResponse.json({ error: "invalid_token" }, { status: 401 });
    }

    // 4. 유저 이메일 확인
    const email = user.email;
    if (!email) {
      return NextResponse.json({ error: "no_email" }, { status: 400 });
    }

    // 5. redirectTo URL 결정
    // 클라이언트가 보낸 redirect_to가 있으면 사용, 없으면 기본값 사용
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://altalt.io";
    const redirectTo = clientRedirectTo || `${baseUrl}/pricing`;

    // 6. Magic Link 생성
    const { data, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      type: "magiclink",
      email,
      options: {
        redirectTo,
      },
    });

    const actionLink = data?.properties?.action_link;
    if (linkError || !actionLink) {
      return NextResponse.json({ error: "cannot_generate_link" }, { status: 500 });
    }

    // 7. 응답 반환
    return NextResponse.json({ url: actionLink }, { status: 200 });
  } catch {
    // 예상치 못한 에러 처리
    return NextResponse.json({ error: "cannot_generate_link" }, { status: 500 });
  }
}
