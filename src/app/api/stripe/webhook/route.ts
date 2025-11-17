import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import Stripe from "stripe";

import { stripe, STRIPE_WEBHOOK_SECRET } from "@/lib/stripe";
import { query } from "@/lib/db";

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
  trialing: "trialing",
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

  await updateUserProfile({
    userId: subscription.metadata?.user_id,
    customerId,
    data: {
      stripe_customer_id: customerId ?? undefined,
      subscription_status: normalizedStatus,
    },
  });
}

async function handleInvoicePaid(invoice: Stripe.Invoice) {
  const customerId = extractCustomerId(invoice.customer);
  if (!customerId) return;

  await updateUserProfile({
    customerId,
    data: {
      subscription_status: "active",
    },
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
  return NextResponse.json({
    status: "ok",
    message: "Webhook endpoint is accessible",
    timestamp: new Date().toISOString(),
  });
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

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, STRIPE_WEBHOOK_SECRET);
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
