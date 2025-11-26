import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import Stripe from "stripe";

import { stripe, getWebhookSecret } from "@/lib/stripe";
import { query } from "@/lib/db";
import { sendStripeSubscriptionNotification } from "@/lib/slack";

export const dynamic = "force-dynamic";

// Supabase Service Role Client (RLS 우회)
const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

const stripeStatusMap: Record<string, string> = {
  active: "active",
  trialing: "active", // trial을 제공하지 않으므로 trialing이 오면 active로 처리
  past_due: "past_due",
  unpaid: "past_due",
  incomplete: "past_due",
  incomplete_expired: "canceled",
  canceled: "canceled",
  paused: "past_due",
};

function normalizeSubscriptionStatus(status?: string | null) {
  return stripeStatusMap[status ?? ""] || "free";
}

function extractCustomerId(
  customer: string | Stripe.Customer | Stripe.DeletedCustomer | null | Stripe.Invoice["customer"]
): string | null {
  if (!customer) return null;
  if (typeof customer === "string") return customer;
  return customer.id;
}

async function updateUserProfile({
  userId,
  customerId,
  data,
}: {
  userId?: string;
  customerId?: string | null;
  data: Record<string, unknown>;
}) {
  const sanitizedData = Object.entries(data).reduce<Record<string, unknown>>((acc, [key, value]) => {
    if (value !== undefined && value !== null) {
      acc[key] = value;
    }
    return acc;
  }, {});

  if (!Object.keys(sanitizedData).length) {
    return false;
  }

  if (!userId && !customerId) {
    return false;
  }

  const targets: Array<{ column: "id" | "stripe_customer_id"; value: string }> = [];
  if (userId) targets.push({ column: "id", value: userId });
  if (customerId) targets.push({ column: "stripe_customer_id", value: customerId });

  for (const target of targets) {
    const { data: rows, error } = await supabaseAdmin
      .from("user_profiles")
      .update(sanitizedData)
      .eq(target.column, target.value)
      .select("id")
      .limit(1);

    if (error) {
      console.error("❌ [WEBHOOK] Failed to update user profile:", error, { target });
      continue;
    }

    if (rows && rows.length > 0) {
      return true;
    }
  }

  console.warn("⚠️ [WEBHOOK] No matching profile to update", { userId, customerId });
  return false;
}

async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
  const userId = session.metadata?.user_id;
  const customerId = extractCustomerId(session.customer);

  if (!userId || !customerId) {
    console.warn("⚠️ [WEBHOOK] Missing metadata/customer on checkout session", {
      userId,
      customerId,
      sessionId: session.id,
    });
    return;
  }

  const data: Record<string, unknown> = {
    stripe_customer_id: customerId,
  };

  if (session.mode === "subscription" && session.payment_status === "paid") {
    data.subscription_status = "active";

    // checkout session에 subscription이 있으면 current_period_end 저장
    if (session.subscription && typeof session.subscription === "string") {
      try {
        const subscription = await stripe.subscriptions.retrieve(session.subscription);
        if ("current_period_end" in subscription && typeof subscription.current_period_end === "number") {
          data.current_period_end = new Date(subscription.current_period_end * 1000).toISOString();
        }
      } catch (error) {
        console.error("❌ [WEBHOOK] Failed to retrieve subscription from checkout session:", error);
      }
    }

    // Slack 알림 전송 (비동기, fire-and-forget)
    sendStripeSubscriptionNotification({
      customerId,
      userId,
      email: session.customer_details?.email || undefined,
      subscriptionId: typeof session.subscription === "string" ? session.subscription : undefined,
      status: "active",
      amount: session.amount_total,
      currency: session.currency,
      created_at: new Date().toISOString(),
    }).catch((error) => {
      console.error("❌ [WEBHOOK] Failed to send Slack notification:", error);
    });
  }

  await updateUserProfile({
    userId,
    customerId,
    data,
  });
}

async function handleSubscriptionEvent(subscription: Stripe.Subscription, forcedStatus?: string) {
  const customerId = extractCustomerId(subscription.customer);
  const normalizedStatus = forcedStatus ?? normalizeSubscriptionStatus(subscription.status);

  const data: Record<string, unknown> = {
    stripe_customer_id: customerId ?? undefined,
    subscription_status: normalizedStatus,
  };

  // current_period_end 저장 (Stripe는 Unix timestamp로 반환)
  if ("current_period_end" in subscription && typeof subscription.current_period_end === "number") {
    data.current_period_end = new Date(subscription.current_period_end * 1000).toISOString();
  }

  await updateUserProfile({
    userId: subscription.metadata?.user_id,
    customerId,
    data,
  });
}

async function handleInvoicePaid(invoice: Stripe.Invoice) {
  const customerId = extractCustomerId(invoice.customer);
  if (!customerId) return;

  const data: Record<string, unknown> = {
    subscription_status: "active",
  };

  // invoice.subscription이 확장된 객체인 경우 current_period_end 업데이트
  // 타입 단언을 사용하여 subscription 속성에 접근
  const invoiceWithSubscription = invoice as Stripe.Invoice & {
    subscription?: string | Stripe.Subscription | null;
  };

  if (
    invoiceWithSubscription.subscription &&
    typeof invoiceWithSubscription.subscription === "object" &&
    "current_period_end" in invoiceWithSubscription.subscription
  ) {
    const subscription = invoiceWithSubscription.subscription as Stripe.Subscription & {
      current_period_end?: number;
    };
    if (typeof subscription.current_period_end === "number") {
      data.current_period_end = new Date(subscription.current_period_end * 1000).toISOString();
    }
  } else if (invoiceWithSubscription.subscription && typeof invoiceWithSubscription.subscription === "string") {
    // subscription이 ID만 있는 경우, Stripe API로 조회
    try {
      const subscription = await stripe.subscriptions.retrieve(invoiceWithSubscription.subscription);
      if ("current_period_end" in subscription && typeof subscription.current_period_end === "number") {
        data.current_period_end = new Date(subscription.current_period_end * 1000).toISOString();
      }
    } catch (error) {
      console.error("❌ [WEBHOOK] Failed to retrieve subscription for invoice:", error);
    }
  }

  await updateUserProfile({
    customerId,
    data,
  });
}

async function handleInvoiceFailed(invoice: Stripe.Invoice) {
  const customerId = extractCustomerId(invoice.customer);
  if (!customerId) return;

  await updateUserProfile({
    customerId,
    data: {
      subscription_status: "past_due",
    },
  });
}

// GET 핸들러: 웹훅 엔드포인트가 정상적으로 등록되었는지 확인
export async function GET() {
  try {
    getWebhookSecret(); // 웹훅 시크릿이 설정되어 있는지 확인
    return NextResponse.json({
      status: "ok",
      message: "Webhook endpoint is accessible",
      webhookSecretConfigured: true,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: "warning",
        message: "Webhook endpoint is accessible, but webhook secret is not configured",
        webhookSecretConfigured: false,
        instructions:
          error instanceof Error
            ? error.message
            : "웹훅 시크릿을 설정하려면 README.md의 'Stripe 웹훅 리스너' 섹션을 참고하세요.",
        timestamp: new Date().toISOString(),
      },
      { status: 200 }
    );
  }
}

export async function POST(req: Request) {
  let body: string;
  try {
    const arrayBuffer = await req.arrayBuffer();
    body = Buffer.from(arrayBuffer).toString("utf8");
  } catch (error) {
    console.error("❌ [WEBHOOK] Failed to read request body:", error);
    return NextResponse.json({ error: "Failed to read request body" }, { status: 400 });
  }

  const signature = req.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing stripe-signature header" }, { status: 400 });
  }

  let webhookSecret: string;
  try {
    webhookSecret = getWebhookSecret();
  } catch (error) {
    console.error("❌ [WEBHOOK] Webhook secret not configured:", error);
    return NextResponse.json(
      {
        error: "Webhook secret not configured",
        message: error instanceof Error ? error.message : "웹훅 시크릿이 설정되지 않았습니다.",
      },
      { status: 500 }
    );
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    console.error("❌ [WEBHOOK] Signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    const existingEvent = await query("SELECT id FROM stripe_events WHERE id = $1", [event.id]);
    if (existingEvent.rows.length > 0) {
      console.log("⚠️ [WEBHOOK] Event already processed:", event.id);
      return new Response(null, { status: 200 });
    }
  } catch (error) {
    console.error("❌ [WEBHOOK] Failed to check existing event:", error);
    return NextResponse.json({ error: "Database error during idempotency check" }, { status: 500 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed":
        await handleCheckoutSessionCompleted(event.data.object as Stripe.Checkout.Session);
        break;
      case "customer.subscription.created":
      case "customer.subscription.updated":
        await handleSubscriptionEvent(event.data.object as Stripe.Subscription);
        break;
      case "customer.subscription.deleted":
        await handleSubscriptionEvent(event.data.object as Stripe.Subscription, "canceled");
        break;
      case "invoice.paid":
        await handleInvoicePaid(event.data.object as Stripe.Invoice);
        break;
      case "invoice.payment_failed":
        await handleInvoiceFailed(event.data.object as Stripe.Invoice);
        break;
      default:
        console.log("ℹ️ [WEBHOOK] Unhandled event type:", event.type);
    }

    try {
      await query("INSERT INTO stripe_events (id, type) VALUES ($1, $2)", [event.id, event.type]);
    } catch (error) {
      console.error("❌ [WEBHOOK] Failed to record event:", error);
    }

    return new Response(null, { status: 200 });
  } catch (error) {
    console.error("❌ [WEBHOOK] Processing error:", error);
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}
