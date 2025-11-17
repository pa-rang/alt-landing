import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { query } from "@/lib/db";
import { stripe } from "@/lib/stripe";

export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
  }

  try {
    // 1. DB에서 현재 상태 확인
    const result = await query<{
      subscription_status: string | null;
      current_period_end: string | null;
      stripe_customer_id: string | null;
    }>(
      `SELECT subscription_status, current_period_end, stripe_customer_id 
       FROM user_profiles 
       WHERE id = $1`,
      [user.id]
    );

    const profile = result.rows[0];
    if (!profile) {
      return NextResponse.json({ error: "프로필을 찾을 수 없습니다." }, { status: 404 });
    }

    const now = new Date();
    const periodEnd = profile.current_period_end ? new Date(profile.current_period_end) : null;

    // 2. 만료되었거나 만료 예정이면 Stripe에서 최신 정보 조회
    if (periodEnd && periodEnd <= now && profile.stripe_customer_id) {
      try {
        // Stripe에서 최신 구독 정보 가져오기
        const subscriptions = await stripe.subscriptions.list({
          customer: profile.stripe_customer_id,
          status: "all",
          limit: 1,
        });

        const latestSubscription = subscriptions.data[0];

        if (latestSubscription) {
          // DB 업데이트
          const stripeStatusMap: Record<string, string> = {
            active: "active",
            trialing: "active",
            past_due: "past_due",
            unpaid: "past_due",
            incomplete: "past_due",
            incomplete_expired: "canceled",
            canceled: "canceled",
            paused: "past_due",
          };

          const newStatus = stripeStatusMap[latestSubscription.status] || "free";
          const newPeriodEnd =
            "current_period_end" in latestSubscription && typeof latestSubscription.current_period_end === "number"
              ? new Date(latestSubscription.current_period_end * 1000).toISOString()
              : null;

          await query(
            `UPDATE user_profiles 
             SET subscription_status = $1, current_period_end = $2, updated_at = NOW()
             WHERE id = $3`,
            [newStatus, newPeriodEnd, user.id]
          );

          const isActive = newStatus === "active" && (!newPeriodEnd || new Date(newPeriodEnd) > now);

          return NextResponse.json({
            subscription_status: newStatus,
            current_period_end: newPeriodEnd,
            is_active: isActive,
            synced: true, // Stripe에서 동기화했음을 표시
          });
        } else {
          // 구독이 없으면 free로 업데이트
          await query(
            `UPDATE user_profiles 
             SET subscription_status = 'free', current_period_end = NULL, updated_at = NOW()
             WHERE id = $1`,
            [user.id]
          );

          return NextResponse.json({
            subscription_status: "free",
            current_period_end: null,
            is_active: false,
            synced: true,
          });
        }
      } catch (stripeError) {
        console.error("❌ [SUBSCRIPTION-STATUS] Stripe API 호출 실패:", stripeError);
        // Stripe 호출 실패해도 DB 값 반환
      }
    }

    // 3. 만료되지 않았으면 DB 값 그대로 반환
    const isExpired = periodEnd ? periodEnd < now : false;
    const isActive = profile.subscription_status === "active" && !isExpired;

    return NextResponse.json({
      subscription_status: profile.subscription_status || "free",
      current_period_end: profile.current_period_end,
      is_active: isActive,
      synced: false, // DB 값만 사용
    });
  } catch (error) {
    console.error("❌ [SUBSCRIPTION-STATUS] Failed to fetch:", error);
    return NextResponse.json({ error: "조회 실패" }, { status: 500 });
  }
}
