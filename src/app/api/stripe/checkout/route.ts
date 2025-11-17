"use server";

import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";
import { query } from "@/lib/db";
import { stripe, buildStripeReturnUrl, getProPlanPriceId } from "@/lib/stripe";

type CheckoutRequestPayload = {
  locale?: string;
};

export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as CheckoutRequestPayload;
  const locale = typeof body.locale === "string" ? body.locale : "en";

  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error) {
    console.error("❌ [STRIPE-CHECKOUT] Failed to fetch user:", error);
  }

  if (!user || !user.id) {
    return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
  }

  if (!user.email) {
    return NextResponse.json({ error: "이메일 정보가 없습니다." }, { status: 400 });
  }

  try {
    await query(
      `
      insert into user_profiles (id, email)
      values ($1, $2)
      on conflict (id) do update
      set email = excluded.email
    `,
      [user.id, user.email]
    );
  } catch (dbError) {
    console.error("❌ [STRIPE-CHECKOUT] Failed to upsert profile:", dbError);
    return NextResponse.json({ error: "프로필 정보를 갱신하지 못했습니다." }, { status: 500 });
  }

  let profile:
    | {
        stripe_customer_id: string | null;
      }
    | undefined;

  try {
    const result = await query<{ stripe_customer_id: string | null }>(
      "select stripe_customer_id from user_profiles where id = $1",
      [user.id]
    );
    profile = result.rows[0];
  } catch (dbError) {
    console.error("❌ [STRIPE-CHECKOUT] Failed to load profile:", dbError);
    return NextResponse.json({ error: "프로필 조회에 실패했습니다." }, { status: 500 });
  }

  let stripeCustomerId = profile?.stripe_customer_id ?? null;

  if (!stripeCustomerId) {
    try {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: {
          supabase_user_id: user.id,
        },
      });
      stripeCustomerId = customer.id;
      await query("update user_profiles set stripe_customer_id = $1 where id = $2", [customer.id, user.id]);
    } catch (stripeError) {
      console.error("❌ [STRIPE-CHECKOUT] Failed to create Stripe customer:", stripeError);
      return NextResponse.json({ error: "Stripe 고객 생성에 실패했습니다." }, { status: 500 });
    }
  }

  try {
    const session = await stripe.checkout.sessions.create({
      customer: stripeCustomerId,
      mode: "subscription",
      line_items: [
        {
          price: getProPlanPriceId(),
          quantity: 1,
        },
      ],
      success_url: buildStripeReturnUrl({ locale, status: "success" }),
      cancel_url: buildStripeReturnUrl({ locale, status: "cancelled" }),
      allow_promotion_codes: true,
      metadata: {
        user_id: user.id,
        locale,
      },
      subscription_data: {
        metadata: {
          user_id: user.id,
        },
      },
      payment_method_collection: "always",
    });

    return NextResponse.json({ url: session.url });
  } catch (stripeError) {
    console.error("❌ [STRIPE-CHECKOUT] Failed to create Checkout session:", stripeError);
    return NextResponse.json({ error: "결제 세션 생성에 실패했습니다." }, { status: 500 });
  }
}

