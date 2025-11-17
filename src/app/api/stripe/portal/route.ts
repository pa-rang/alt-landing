"use server";

import { NextResponse } from "next/server";

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

  try {
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: profile.stripe_customer_id,
      return_url: buildStripeReturnUrl({ locale }),
    });

    return NextResponse.json({ url: portalSession.url });
  } catch (stripeError) {
    console.error("❌ [STRIPE-PORTAL] Failed to create portal session:", stripeError);
    return NextResponse.json({ error: "포털 생성에 실패했습니다." }, { status: 500 });
  }
}

