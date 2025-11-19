"use server";

import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";
import { query } from "@/lib/db";
import { stripe, buildStripeReturnUrl, getProPlanPriceId } from "@/lib/stripe";
import Stripe from "stripe";

type CheckoutRequestPayload = {
  locale?: string;
};

/**
 * Creates a new Stripe Customer and updates the database with the new ID.
 * This is used when a customer ID is missing or invalid (e.g. environment mismatch).
 */
async function createAndSyncStripeCustomer(userId: string, email: string): Promise<string> {
  console.log(`🔄 Creating new Stripe customer for user ${userId}...`);

  const customer = await stripe.customers.create({
    email,
    metadata: {
      supabase_user_id: userId,
    },
  });

  await query("update user_profiles set stripe_customer_id = $1 where id = $2", [customer.id, userId]);

  console.log(`✅ Created new Stripe customer: ${customer.id}`);
  return customer.id;
}

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

  // 1. If no customer ID exists in DB, create one immediately
  if (!stripeCustomerId) {
    try {
      stripeCustomerId = await createAndSyncStripeCustomer(user.id, user.email);
    } catch (stripeError) {
      console.error("❌ [STRIPE-CHECKOUT] Failed to create Stripe customer:", stripeError);
      return NextResponse.json({ error: "Stripe 고객 생성에 실패했습니다." }, { status: 500 });
    }
  }

  // Common session parameters
  const sessionParams: Stripe.Checkout.SessionCreateParams = {
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
  };

  try {
    // 2. Try creating the session with the existing (or just created) customer ID
    const session = await stripe.checkout.sessions.create({
      customer: stripeCustomerId,
      ...sessionParams,
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    const stripeError = err as Stripe.errors.StripeError;
    // 3. Handle "resource_missing" error (Customer ID from DB doesn't exist in current Stripe env)
    if (stripeError?.code === "resource_missing" && stripeError?.param === "customer") {
      console.warn(
        `⚠️ [STRIPE-CHECKOUT] Customer ${stripeCustomerId} not found in current environment. Attempting to recreate...`
      );

      try {
        const newCustomerId = await createAndSyncStripeCustomer(user.id, user.email);

        // Retry session creation with new customer ID
        const session = await stripe.checkout.sessions.create({
          customer: newCustomerId,
          ...sessionParams,
        });

        return NextResponse.json({ url: session.url });
      } catch (retryError) {
        console.error("❌ [STRIPE-CHECKOUT] Recovery failed:", retryError);
        return NextResponse.json(
          { error: "결제 세션 복구에 실패했습니다. 잠시 후 다시 시도해주세요." },
          { status: 500 }
        );
      }
    }

    console.error("❌ [STRIPE-CHECKOUT] Failed to create Checkout session:", stripeError);
    return NextResponse.json({ error: "결제 세션 생성에 실패했습니다." }, { status: 500 });
  }
}
