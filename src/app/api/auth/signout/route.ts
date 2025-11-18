import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * 로그아웃
 * 쿠키 기반 세션 또는 Authorization 헤더를 지원합니다.
 */
export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    // Authorization 헤더 확인 (일렉트론 앱용)
    const authHeader = request.headers.get("authorization");
    if (authHeader?.startsWith("Bearer ")) {
      // 토큰으로 직접 signOut (Supabase는 쿠키 기반이므로 이 경우는 단순히 성공 반환)
      // 실제로는 클라이언트에서 세션을 삭제하면 됩니다.
      return NextResponse.json({ success: true });
    }

    // 쿠키 기반 세션 로그아웃 (웹용)
    const { error } = await supabase.auth.signOut();

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Sign out error:", error);
    return NextResponse.json(
      { error: "An error occurred" },
      { status: 500 }
    );
  }
}

