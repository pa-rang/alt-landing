import { notFound } from "next/navigation";

import { isSupportedLocale, type Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionary";
import { createClient } from "@/lib/supabase/server";
import { query } from "@/lib/db";
import PricingPageClient from "./PricingPageClient";

type PricingPageProps = {
  params: Promise<{
    locale: string;
  }>;
};

export default async function PricingPage({ params }: PricingPageProps) {
  const { locale } = await params;

  if (!isSupportedLocale(locale)) {
    notFound();
  }

  const dictionary = await getDictionary(locale);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let subscriptionStatus = "free";

  if (user) {
    try {
      const result = await query<{ subscription_status: string | null }>(
        "select subscription_status from user_profiles where id = $1",
        [user.id]
      );
      subscriptionStatus = result.rows[0]?.subscription_status ?? "free";
    } catch (error) {
      console.error("❌ [PRICING] Failed to load subscription status:", error);
    }
  }

  return (
    <div className="min-h-screen bg-linear-to-b from-background to-muted/30">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:py-20">
        <PricingPageClient
          dictionary={dictionary.pricing}
          locale={locale as Locale}
          isAuthenticated={!!user}
          subscriptionStatus={subscriptionStatus}
        />
      </div>
    </div>
  );
}

