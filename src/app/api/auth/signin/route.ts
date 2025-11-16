import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Email OTP 인증 코드 전송
 * 
 * Supabase 대시보드에서 이메일 템플릿을 수정해야 합니다:
 * 1. Supabase Dashboard > Authentication > Templates
 * 2. "Magic Link" 템플릿을 선택하거나 새 템플릿 생성
 * 3. 템플릿 내용에서 {{ .ConfirmationURL }} 제거
 * 4. {{ .Token }} 변수를 추가하여 OTP 코드 표시
 * 
 * 예시 템플릿:
 * "Your verification code is: {{ .Token }}"
 * 
 * 이렇게 하면 Magic Link 대신 6자리 OTP 코드가 이메일로 전송됩니다.
 */
export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email || typeof email !== "string") {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Email OTP 방식: emailRedirectTo를 설정하지 않으면 OTP 코드를 이메일로 전송
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: true,
        // emailRedirectTo를 설정하지 않으면 Email OTP 코드가 전송됩니다
        // (Supabase 대시보드에서 Email OTP가 활성화되어 있어야 함)
      },
    });

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Sign in error:", error);
    return NextResponse.json(
      { error: "An error occurred" },
      { status: 500 }
    );
  }
}

