"use client";

import { useRouter } from "next/navigation";
import { CircleUserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/DropdownMenu";
import { toast } from "sonner";
import { useStripePortal } from "@/hooks/useStripePortal";
import type { Locale } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n/dictionary";

type AuthButtonProps = {
  locale: Locale;
  dictionary: Dictionary;
  isAuthenticated: boolean;
  userEmail?: string | null;
  subscriptionStatus?: string | null;
};

const managedStatuses = new Set(["active", "past_due"]);

export function AuthButton({ locale, dictionary, isAuthenticated, userEmail, subscriptionStatus }: AuthButtonProps) {
  const router = useRouter();
  const { openPortal, isLoading: isPortalLoading } = useStripePortal({ locale, dictionary });

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
            <DropdownMenuItem onClick={openPortal} disabled={isPortalLoading}>
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
