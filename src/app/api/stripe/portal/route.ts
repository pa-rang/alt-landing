"use server";

import { NextResponse } from "next/server";

import Stripe from "stripe";

import { createClient } from "@/lib/supabase/server";
import { query } from "@/lib/db";
import { stripe, buildStripeReturnUrl } from "@/lib/stripe";

type PortalRequestPayload = {
  locale?: string;
};

const MANAGEABLE_STATUSES = new Set(["active", "past_due"]);

export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as PortalRequestPayload;
  const locale = typeof body.locale === "string" ? body.locale : "en";

  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error) {
    console.error("❌ [STRIPE-PORTAL] Failed to fetch user:", error);
  }

  if (!user) {
    return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
  }

  let profile:
    | {
        stripe_customer_id: string | null;
        subscription_status: string | null;
      }
    | undefined;

  try {
    const result = await query<{ stripe_customer_id: string | null; subscription_status: string | null }>(
      "select stripe_customer_id, subscription_status from user_profiles where id = $1",
      [user.id]
    );
    profile = result.rows[0];
  } catch (dbError) {
    console.error("❌ [STRIPE-PORTAL] Failed to load profile:", dbError);
    return NextResponse.json({ error: "프로필 조회에 실패했습니다." }, { status: 500 });
  }

  if (!profile?.stripe_customer_id) {
    return NextResponse.json({ error: "Stripe 고객 정보가 없습니다." }, { status: 400 });
  }

  if (!MANAGEABLE_STATUSES.has(profile.subscription_status ?? "free")) {
    return NextResponse.json({ error: "활성화된 구독이 없습니다." }, { status: 403 });
  }

  console.log("🔍 [STRIPE-PORTAL] Creating portal session...", {
    stripeMode: process.env.STRIPE_MODE,
    customerId: profile.stripe_customer_id,
    hasLiveKey: !!process.env.STRIPE_LIVE_SECRET_KEY,
    hasTestKey: !!process.env.STRIPE_TEST_SECRET_KEY,
  });

  try {
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: profile.stripe_customer_id,
      return_url: buildStripeReturnUrl({ locale }),
    });

    return NextResponse.json({ url: portalSession.url });
  } catch (err: unknown) {
    const stripeError = err as Stripe.errors.StripeError;
    console.error("❌ [STRIPE-PORTAL] Failed to create portal session:", stripeError);

    // Stripe에서 고객이 삭제되었거나 존재하지 않는 경우
    if (stripeError?.code === "resource_missing" && stripeError?.message?.includes("No such customer")) {
      console.log("⚠️ [STRIPE-PORTAL] Customer deleted in Stripe. Resetting user profile...", {
        userId: user.id,
        invalidCustomerId: profile.stripe_customer_id,
      });

      try {
        await query("UPDATE user_profiles SET stripe_customer_id = NULL, subscription_status = 'free' WHERE id = $1", [
          user.id,
        ]);
        return NextResponse.json(
          { error: "구독 정보가 초기화되었습니다. 다시 구독해주세요." },
          { status: 404 } // 404로 클라이언트에 알림
        );
      } catch (dbError) {
        console.error("❌ [STRIPE-PORTAL] Failed to reset user profile:", dbError);
      }
    }

    return NextResponse.json({ error: "포털 생성에 실패했습니다." }, { status: 500 });
  }
}
