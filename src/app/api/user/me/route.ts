import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { query } from "@/lib/db";

export const dynamic = "force-dynamic";

type SubscriptionStatus = "free" | "active" | "past_due" | "canceled";

type ProfileData = {
  display_name: string | null;
  avatar_url: string | null;
  stripe_customer_id: string | null;
  subscription_status: SubscriptionStatus | null;
  current_period_end: string | null;
};

/**
 * 현재 인증된 사용자의 최신 정보 조회
 * /api/auth/verify의 user와 동일한 타입으로 반환합니다.
 * 쿠키 기반 세션 또는 Authorization 헤더를 지원합니다.
 */
export async function GET(request: Request) {
  try {
    const supabase = await createClient();

    // 사용자 인증 확인 (쿠키 기반 또는 Bearer 토큰)
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // user_profiles 테이블에서 프로필 정보 조회
    let profileData: ProfileData | null = null;
    try {
      const profileResult = await query<ProfileData>(
        `SELECT display_name, avatar_url, stripe_customer_id, subscription_status, current_period_end
         FROM user_profiles 
         WHERE id = $1`,
        [user.id]
      );

      profileData = profileResult.rows[0] || null;
    } catch (profileError) {
      console.error("Failed to fetch user profile:", profileError);
      // 프로필 조회 실패해도 계속 진행
    }

    return NextResponse.json({
      id: user.id,
      email: user.email,
      display_name: profileData?.display_name || null,
      avatar_url: profileData?.avatar_url || null,
      stripe_customer_id: profileData?.stripe_customer_id || null,
      subscription_status: (profileData?.subscription_status || "free") as SubscriptionStatus,
      current_period_end: profileData?.current_period_end || null,
    });
  } catch (error) {
    console.error("User profile fetch error:", error);
    return NextResponse.json({ error: "An error occurred" }, { status: 500 });
  }
}
