"use client";

import { ChevronRight, Check } from "lucide-react";

import { Button } from "@/components/ui/button";
import { DownloadButton } from "@/components/game/DownloadButton";
import { accentGradient } from "@/lib/utils";

type Plan = {
  name: string;
  price: string;
  pricePeriod: string;
  description: string;
  highlight?: string;
  features?: string[];
  coreFeatures?: string[];
  otherFeatures?: string[];
  cta?: string;
  ctaSubscribe?: string;
  ctaLogin?: string;
  ctaSubscribed?: string;
};

type PricingPlanCardProps = {
  plan: Plan;
  isPro?: boolean;
  isSubscribed?: boolean;
  isAuthenticated?: boolean;
  onSubscribe?: () => void;
  onManageSubscription?: () => void;
  isCheckoutLoading?: boolean;
  isPortalLoading?: boolean;
  featureLabels?: {
    core: string;
    others: string;
  };
};

export function PricingPlanCard({
  plan,
  isPro = false,
  isSubscribed = false,
  isAuthenticated = false,
  onSubscribe,
  onManageSubscription,
  isCheckoutLoading = false,
  isPortalLoading = false,
  featureLabels,
}: PricingPlanCardProps) {
  const nameClassName = isPro
    ? `text-sm font-semibold uppercase tracking-wide ${accentGradient.text}`
    : "text-sm font-semibold uppercase tracking-wide text-muted-foreground";

  const renderButton = () => {
    if (!isPro) {
      return (
        <DownloadButton variant="outline" size="lg" className="w-full rounded-lg" location="pricing">
          {plan.cta}
        </DownloadButton>
      );
    }

    if (isSubscribed) {
      return (
        <Button
          size="lg"
          className="w-full rounded-lg flex items-center"
          variant="default"
          onClick={onManageSubscription}
          disabled={isPortalLoading}
        >
          <span>{plan.ctaSubscribed}</span>
          <ChevronRight className="h-4 w-4" />
        </Button>
      );
    }

    return (
      <Button size="lg" className="w-full rounded-lg" onClick={onSubscribe} disabled={isCheckoutLoading}>
        {isAuthenticated ? plan.ctaSubscribe : plan.ctaLogin}
      </Button>
    );
  };

  return (
    <div
      className="rounded-2xl bg-white p-4 sm:p-6"
      style={{
        boxShadow: "0 2px 24px rgba(0, 0, 0, 0.02)",
      }}
    >
      <div className="space-y-4">
        <div>
          <span className={nameClassName}>{plan.name}</span>
          <div>
            <p className={`mt-1 text-3xl font-light ${isPro ? "text-primary" : "text-foreground"}`}>
              {plan.description}
            </p>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-4xl font-semibold">{plan.price}</span>
            <span className="text-sm text-muted-foreground">{plan.pricePeriod}</span>
          </div>
        </div>

        {renderButton()}

        <div className="space-y-6 mt-2">
          {(plan.coreFeatures || plan.features) && (
            <div className="space-y-3">
              {plan.highlight && <p className="text-sm font-semibold text-foreground">{plan.highlight}</p>}
              <ul className="space-y-3 text-sm text-stone-800">
                {(plan.coreFeatures || plan.features || []).map((feature) => (
                  <li key={feature} className="flex items-start gap-2">
                    <Check className="mt-0.5 h-4 w-4 text-stone-800 shrink-0" aria-hidden="true" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {plan.otherFeatures && (
            <div className="space-y-3">
              {featureLabels && <p className="text-sm font-semibold text-foreground">{featureLabels.others}</p>}
              <ul className="space-y-3 text-sm text-stone-800">
                {plan.otherFeatures.map((feature) => (
                  <li key={feature} className="flex items-start gap-2">
                    <Check className="mt-0.5 h-4 w-4 text-stone-800 shrink-0" aria-hidden="true" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
