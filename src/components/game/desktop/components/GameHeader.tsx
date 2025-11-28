"use client";

import Image from "next/image";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { AuthButton } from "@/components/AuthButton";
import { RecentPlaysDesktop } from "../../RecentPlays";
import type { Dictionary } from "@/lib/i18n/dictionary";
import type { Locale } from "@/lib/i18n/config";

type GameHeaderProps = {
  locale: Locale;
  dictionary: Dictionary["game"];
  fullDictionary: Dictionary;
  leaderboardRefreshTrigger: number;
  currentPromoType: "normal" | "super" | null;
  isAuthenticated: boolean;
  userEmail: string | null;
  subscriptionStatus: string | null;
  promoBannerButtonRef: React.RefObject<HTMLButtonElement | null>;
  onClose: () => void;
  onTogglePromoBanner: () => void;
};

export function GameHeader({
  locale,
  dictionary,
  fullDictionary,
  leaderboardRefreshTrigger,
  currentPromoType,
  isAuthenticated,
  userEmail,
  subscriptionStatus,
  promoBannerButtonRef,
  onClose,
  onTogglePromoBanner,
}: GameHeaderProps) {
  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-10000 max-w-7xl w-full px-4">
      <div className="flex items-center justify-between gap-2">
        <Button className="text-white bg-white/15" onClick={onClose}>
          {dictionary.homeButton}
        </Button>
        <div className="flex items-center gap-2">
          <RecentPlaysDesktop refreshTrigger={leaderboardRefreshTrigger} dictionary={dictionary} />
          {currentPromoType && (
            <Button
              ref={promoBannerButtonRef}
              className={cn(
                "text-white gap-2",
                currentPromoType === "super"
                  ? "bg-purple-600 hover:bg-purple-700"
                  : "bg-emerald-600 hover:bg-emerald-700"
              )}
              onClick={onTogglePromoBanner}
            >
              <Image
                src={currentPromoType === "super" ? "/icons/🎟️ entry_ticket.svg" : "/icons/🎫 ticket.svg"}
                alt="ticket"
                width={20}
                height={20}
              />
              <span className="hidden sm:inline">
                {currentPromoType === "super" ? dictionary.superPromoCodeDescription : dictionary.promoCodeDescription}
              </span>
            </Button>
          )}
          <AuthButton
            locale={locale}
            dictionary={fullDictionary}
            isAuthenticated={isAuthenticated}
            userEmail={userEmail}
            subscriptionStatus={subscriptionStatus}
          />
        </div>
      </div>
    </div>
  );
}
