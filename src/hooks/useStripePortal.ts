"use client";

import { useState, useCallback } from "react";
import { toast } from "sonner";
import type { Locale } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n/dictionary";

type UseStripePortalOptions = {
  locale: Locale;
  dictionary: Dictionary;
};

export function useStripePortal({ locale, dictionary }: UseStripePortalOptions) {
  const [isLoading, setIsLoading] = useState(false);

  const openPortal = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/stripe/portal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ locale }),
      });

      if (!response.ok) {
        throw new Error("Failed to create portal session");
      }

      const payload = (await response.json()) as { url?: string };
      if (!payload.url) {
        throw new Error("Missing portal url");
      }

      window.location.href = payload.url;
    } catch (error) {
      console.error("❌ [STRIPE-PORTAL] Portal error:", error);
      toast.error(dictionary.pricing?.messages.portalError || dictionary.auth.messages.genericError);
    } finally {
      setIsLoading(false);
    }
  }, [locale, dictionary]);

  return {
    openPortal,
    isLoading,
  };
}

