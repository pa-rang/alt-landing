import { ChevronRight, Check } from "lucide-react";

import { Button } from "@/components/ui/button";

type Plan = {
  name: string;
  price: string;
  pricePeriod: string;
  description: string;
  features: string[];
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
}: PricingPlanCardProps) {
  const nameClassName = isPro
    ? "text-sm font-semibold uppercase tracking-wide text-primary"
    : "text-sm font-semibold uppercase tracking-wide text-muted-foreground";

  const renderButton = () => {
    if (!isPro) {
      return (
        <Button variant="outline" size="lg" className="w-full rounded-lg" disabled>
          {plan.cta}
        </Button>
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
    <div className="rounded-2xl bg-white p-6 sm:p-8">
      <div className="space-y-4">
        <div>
          <p className={nameClassName}>{plan.name}</p>
          <div>
            <p className="text-sm text-muted-foreground">{plan.description}</p>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-4xl font-semibold">{plan.price}</span>
            <span className="text-sm text-muted-foreground">{plan.pricePeriod}</span>
          </div>
        </div>

        {renderButton()}

        <ul className="space-y-3 text-sm text-muted-foreground">
          {plan.features.map((feature) => (
            <li key={feature} className="flex items-start gap-2">
              <Check
                className={isPro ? "mt-0.5 h-4 w-4 text-primary shrink-0" : "mt-0.5 h-4 w-4 text-zinc-400 shrink-0"}
                aria-hidden="true"
              />
              <span>{feature}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
