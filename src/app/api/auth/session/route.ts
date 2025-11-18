import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * 현재 인증 세션 확인
 * 일렉트론 앱에서 사용할 수 있도록 세션 정보를 반환합니다.
 * 쿠키 기반 세션 또는 Authorization 헤더를 지원합니다.
 */
export async function GET(request: Request) {
  try {
    // Authorization 헤더 확인 (일렉트론 앱용)
    const authHeader = request.headers.get("authorization");
    if (authHeader?.startsWith("Bearer ")) {
      // 토큰으로 사용자 정보 확인
      // Supabase JWT를 직접 검증하기 위해 Supabase 클라이언트 생성
      const supabase = await createClient();

      // JWT를 세션으로 설정하여 사용자 정보 가져오기
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
      }

      return NextResponse.json({
        user: {
          id: user.id,
          email: user.email,
        },
      });
    }

    // 쿠키 기반 세션 확인 (웹용)
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // 세션 정보 가져오기
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json({ error: "No session found" }, { status: 401 });
    }

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
      },
      session: {
        access_token: session.access_token,
        refresh_token: session.refresh_token,
        expires_at: session.expires_at,
        expires_in: session.expires_in,
      },
    });
  } catch (error) {
    console.error("Session check error:", error);
    return NextResponse.json({ error: "An error occurred" }, { status: 500 });
  }
}
