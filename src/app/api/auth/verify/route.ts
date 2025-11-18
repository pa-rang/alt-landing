import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { query } from "@/lib/db";

export async function POST(request: Request) {
  try {
    const { email, token } = await request.json();

    if (!email || typeof email !== "string") {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    if (!token || typeof token !== "string") {
      return NextResponse.json({ error: "Token is required" }, { status: 400 });
    }

    const supabase = await createClient();

    const { data, error } = await supabase.auth.verifyOtp({
      email,
      token,
      type: "email",
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    // 일렉트론 앱을 위한 세션 정보 반환
    if (data.session && data.user) {
      const userId = data.user.id;

      // user_profiles 테이블에서 프로필 정보 조회
      let profileData = null;
      try {
        const profileResult = await query<{
          display_name: string | null;
          avatar_url: string | null;
          stripe_customer_id: string | null;
          subscription_status: string | null;
          current_period_end: string | null;
        }>(
          `SELECT display_name, avatar_url, stripe_customer_id, subscription_status, current_period_end
           FROM user_profiles 
           WHERE id = $1`,
          [userId]
        );

        profileData = profileResult.rows[0] || null;
      } catch (profileError) {
        console.error("Failed to fetch user profile:", profileError);
        // 프로필 조회 실패해도 계속 진행
      }

      return NextResponse.json({
        success: true,
        session: {
          access_token: data.session.access_token,
          refresh_token: data.session.refresh_token,
          expires_at: data.session.expires_at,
          expires_in: data.session.expires_in,
        },
        user: {
          id: data.user.id,
          email: data.user.email,
          display_name: profileData?.display_name || null,
          avatar_url: profileData?.avatar_url || null,
          stripe_customer_id: profileData?.stripe_customer_id || null,
          subscription_status: profileData?.subscription_status || "free",
          current_period_end: profileData?.current_period_end || null,
        },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Verify error:", error);
    return NextResponse.json({ error: "An error occurred" }, { status: 500 });
  }
}
