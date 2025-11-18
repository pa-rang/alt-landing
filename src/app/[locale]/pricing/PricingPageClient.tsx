"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";

import { PricingPlanCard } from "@/components/PricingPlanCard";
import { useStripePortal } from "@/hooks/useStripePortal";
import { useMagicLinkAuth } from "@/hooks/useMagicLinkAuth";
import type { Locale } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n/dictionary";

type PricingDictionary = Dictionary["pricing"];

type PricingPageClientProps = {
  dictionary: PricingDictionary;
  fullDictionary: Dictionary;
  locale: Locale;
  isAuthenticated: boolean;
  subscriptionStatus: string;
};

const activeStatuses = new Set(["active", "past_due"]);

export default function PricingPageClient({
  dictionary,
  fullDictionary,
  locale,
  isAuthenticated,
  subscriptionStatus,
}: PricingPageClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const hasHandledStatus = useRef(false);

  const [isCheckoutLoading, setCheckoutLoading] = useState(false);
  const { openPortal, isLoading: isPortalLoading } = useStripePortal({
    locale,
    dictionary: fullDictionary,
  });

  const isSubscribed = useMemo(() => activeStatuses.has(subscriptionStatus ?? "free"), [subscriptionStatus]);

  // Magic Link 인증 처리
  useMagicLinkAuth({
    errorMessage: dictionary.messages.checkoutError,
  });

  useEffect(() => {
    if (hasHandledStatus.current) {
      return;
    }

    const statusParam = searchParams.get("status");
    if (!statusParam) {
      return;
    }

    hasHandledStatus.current = true;

    if (statusParam === "success") {
      toast.success(dictionary.messages.success);
    } else if (statusParam === "cancelled") {
      toast.info(dictionary.messages.cancelled);
    }

    const next = new URLSearchParams(searchParams);
    next.delete("status");

    const queryString = next.toString();
    router.replace(`/${locale}/pricing${queryString ? `?${queryString}` : ""}`, { scroll: false });
  }, [dictionary.messages.cancelled, dictionary.messages.success, locale, router, searchParams]);

  const handleSubscribe = useCallback(async () => {
    if (isSubscribed) {
      return;
    }

    if (!isAuthenticated) {
      router.push(`/${locale}/auth?redirect=/pricing`);
      return;
    }

    setCheckoutLoading(true);
    try {
      const response = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ locale }),
      });

      if (!response.ok) {
        throw new Error("Failed to start checkout");
      }

      const payload = (await response.json()) as { url?: string };

      if (!payload.url) {
        throw new Error("Missing checkout url");
      }

      window.location.href = payload.url;
    } catch (error) {
      console.error("❌ [PRICING] Checkout error:", error);
      toast.error(dictionary.messages.checkoutError);
    } finally {
      setCheckoutLoading(false);
    }
  }, [dictionary.messages.checkoutError, isAuthenticated, isSubscribed, locale, router]);

  const handleManageSubscription = useCallback(() => {
    if (!isSubscribed) {
      return;
    }
    openPortal();
  }, [isSubscribed, openPortal]);

  const freePlan = dictionary.plans.free;
  const proPlan = dictionary.plans.pro;

  return (
    <div className="space-y-12">
      <div className="text-center space-y-4">
        <span className="inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium uppercase tracking-wide text-primary/80">
          {dictionary.badge}
        </span>
        <div className="space-y-3">
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">{dictionary.title}</h1>
          <p className="text-base text-muted-foreground sm:text-lg">{dictionary.subtitle}</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <PricingPlanCard plan={freePlan} />

        <PricingPlanCard
          plan={proPlan}
          isPro
          isSubscribed={isSubscribed}
          isAuthenticated={isAuthenticated}
          onSubscribe={handleSubscribe}
          onManageSubscription={handleManageSubscription}
          isCheckoutLoading={isCheckoutLoading}
          isPortalLoading={isPortalLoading}
        />
      </div>
    </div>
  );
}
