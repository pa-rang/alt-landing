"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CircleUserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/DropdownMenu";
import { toast } from "sonner";
import type { Locale } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n/dictionary";

type AuthButtonProps = {
  locale: Locale;
  dictionary: Dictionary;
  isAuthenticated: boolean;
  userEmail?: string | null;
  subscriptionStatus?: string | null;
};

const managedStatuses = new Set(["active", "trialing", "past_due"]);

export function AuthButton({ locale, dictionary, isAuthenticated, userEmail, subscriptionStatus }: AuthButtonProps) {
  const router = useRouter();
  const [isPortalLoading, setPortalLoading] = useState(false);

  const handleLogout = async () => {
    try {
      const response = await fetch("/api/auth/signout", {
        method: "POST",
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || dictionary.auth.messages.genericError);
        return;
      }
      router.refresh();
    } catch {
      toast.error(dictionary.auth.messages.serverError);
    }
  };

  const handleManageSubscription = async () => {
    try {
      setPortalLoading(true);
      const response = await fetch("/api/stripe/portal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ locale }),
      });

      if (!response.ok) {
        throw new Error("Failed to open portal");
      }

      const payload = (await response.json()) as { url?: string };
      if (!payload.url) {
        throw new Error("Missing portal url");
      }

      window.location.href = payload.url;
    } catch (error) {
      console.error("❌ [AUTH BUTTON] Portal error:", error);
      toast.error(dictionary.pricing?.messages.portalError || dictionary.auth.messages.genericError);
    } finally {
      setPortalLoading(false);
    }
  };

  const canManageSubscription = subscriptionStatus ? managedStatuses.has(subscriptionStatus) : false;

  if (isAuthenticated && userEmail) {
    const emailPrefix = userEmail.split("@")[0];

    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="rounded-full shadow-none text-[13px]">
            <CircleUserRound />
            <span className="sr-only sm:not-sr-only">{emailPrefix}</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {canManageSubscription && (
            <DropdownMenuItem onClick={handleManageSubscription} disabled={isPortalLoading}>
              {dictionary.auth.header.manageSubscription}
            </DropdownMenuItem>
          )}
          <DropdownMenuItem onClick={handleLogout}>{dictionary.auth.header.logout}</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <Button
      variant="outline"
      size="sm"
      className="rounded-full shadow-none"
      onClick={() => router.push(`/${locale}/auth`)}
      aria-label={dictionary.auth.header.login}
    >
      <CircleUserRound />
    </Button>
  );
}
