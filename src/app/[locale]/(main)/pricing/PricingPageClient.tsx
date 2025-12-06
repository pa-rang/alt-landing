"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import confetti from "canvas-confetti";

import { PricingPlanCard } from "@/components/PricingPlanCard";
import { useStripePortal } from "@/hooks/useStripePortal";
import { useMagicLinkAuth } from "@/hooks/useMagicLinkAuth";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { openAppOnSubscriptionSuccess } from "@/lib/deep-link";
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
  const [showSuccessModal, setShowSuccessModal] = useState(false);
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
      setShowSuccessModal(true);
      const duration = 3 * 1000;
      const animationEnd = Date.now() + duration;
      const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

      const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

      const interval = setInterval(function () {
        const timeLeft = animationEnd - Date.now();

        if (timeLeft <= 0) {
          return clearInterval(interval);
        }

        const particleCount = 50 * (timeLeft / duration);
        confetti({
          ...defaults,
          particleCount,
          origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
        });
        confetti({
          ...defaults,
          particleCount,
          origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
        });
      }, 250);
    } else if (statusParam === "cancelled") {
      toast.info(dictionary.messages.cancelled);
    }

    const next = new URLSearchParams(searchParams);
    next.delete("status");

    const queryString = next.toString();
    router.replace(`/pricing${queryString ? `?${queryString}` : ""}`, { scroll: false });
  }, [dictionary.messages.cancelled, dictionary.messages.success, locale, router, searchParams]);

  // 구독 시작 모달이 열릴 때 alt 앱 딥링크 트리거
  useEffect(() => {
    if (showSuccessModal) {
      // 딥링크를 통해 앱 열기 (fallback: 다운로드 페이지)
      const fallbackUrl = `/download`;
      openAppOnSubscriptionSuccess(fallbackUrl);
    }
  }, [showSuccessModal, locale]);

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
    <div className="space-y-8 md:space-y-16">
      <div className="text-center space-y-6">
        <div className="space-y-5">
          <h1 className="text-3xl font-bold tracking-tight sm:text-5xl whitespace-pre-line leading-tight">
            {dictionary.title}
          </h1>
          <p className="text-base text-regular text-stone-700 sm:text-xl">{dictionary.subtitle}</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <PricingPlanCard plan={freePlan} featureLabels={dictionary.featureLabels} />

        <PricingPlanCard
          plan={proPlan}
          featureLabels={dictionary.featureLabels}
          isPro
          isSubscribed={isSubscribed}
          isAuthenticated={isAuthenticated}
          onSubscribe={handleSubscribe}
          onManageSubscription={handleManageSubscription}
          isCheckoutLoading={isCheckoutLoading}
          isPortalLoading={isPortalLoading}
        />
      </div>

      <Dialog open={showSuccessModal} onOpenChange={setShowSuccessModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center text-2xl">🎉 {dictionary.messages.success}</DialogTitle>
            <DialogDescription className="text-center pt-2">
              {dictionary.messages.successModalDescription}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="sm:justify-center gap-2 flex-col sm:flex-row">
            <Button variant="outline" className="w-full sm:w-auto" onClick={() => setShowSuccessModal(false)}>
              {dictionary.messages.successModalClose}
            </Button>
            <Button
              className="w-full sm:w-auto"
              onClick={() => {
                // 앱 열기 버튼 클릭 시 딥링크 실행
                const fallbackUrl = `/download`;
                openAppOnSubscriptionSuccess(fallbackUrl);
                setShowSuccessModal(false);
              }}
            >
              {dictionary.messages.successModalOpenApp}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
