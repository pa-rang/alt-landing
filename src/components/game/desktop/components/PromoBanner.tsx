"use client";

import Link from "next/link";
import Image from "next/image";
import { Copy, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { PROMO_CODE, SUPER_PROMO_CODE } from "@/lib/apple-game";
import type { Dictionary } from "@/lib/i18n/dictionary";

type PromoBannerProps = {
  isVisible: boolean;
  promoType: "normal" | "super" | null;
  promoCodeCopied: boolean;
  promoBannerRef: React.RefObject<HTMLDivElement | null>;
  dictionary: Dictionary["game"];
  onCopyPromoCode: (isSuper: boolean) => void;
};

export function PromoBanner({
  isVisible,
  promoType,
  promoCodeCopied,
  promoBannerRef,
  dictionary,
  onCopyPromoCode,
}: PromoBannerProps) {
  if (!promoType) return null;

  return (
    <div
      className={cn(
        "fixed top-0 left-1/2 -translate-x-1/2 z-10000 transition-transform duration-300 ease-out",
        isVisible ? "translate-y-4" : "-translate-y-full"
      )}
    >
      <div
        ref={promoBannerRef}
        className={cn(
          "relative text-white px-6 py-4 rounded-xl shadow-2xl backdrop-blur-sm border border-white/20 min-w-[320px] max-w-[90vw] flex flex-col sm:flex-row items-center gap-4",
          promoType === "super"
            ? "bg-linear-to-r from-purple-600 via-pink-600 to-purple-600"
            : "bg-linear-to-r from-emerald-500 via-emerald-600 to-emerald-500"
        )}
      >
        <div className="flex-1 text-center sm:text-left">
          <div className="text-lg font-bold flex items-center justify-center sm:justify-start gap-2">
            <Image
              src={promoType === "super" ? "/icons/🎟️ entry_ticket.svg" : "/icons/🎫 ticket.svg"}
              alt="ticket"
              width={28}
              height={28}
              className="animate-bounce"
            />
            <span>
              {promoType === "super"
                ? dictionary.superPromoCodeDescription
                : dictionary.promoCodeDescription}
            </span>
          </div>
          <p className="text-sm text-white/90 mt-1">
            {promoType === "super"
              ? dictionary.superPromoToastDescription
              : dictionary.promoToastDescription}
          </p>
          <p className="text-xs text-white/70 mt-1">{dictionary.promoUseGuide}</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-white/20 rounded-lg px-3 py-2 border border-white/30">
            <span className="font-mono font-bold text-lg tracking-wider">
              {promoType === "super" ? SUPER_PROMO_CODE : PROMO_CODE}
            </span>
            <button
              onClick={() => onCopyPromoCode(promoType === "super")}
              className="ml-2 p-1 hover:bg-white/20 rounded transition-colors"
              aria-label={dictionary.copyPromoCode}
            >
              {promoCodeCopied ? <Check className="w-4 h-4 text-white" /> : <Copy className="w-4 h-4 text-white" />}
            </button>
          </div>
          <Link
            href="/pricing"
            className={cn(
              "font-semibold shadow-lg hover:scale-105 transition-transform px-4 py-2 rounded-lg text-sm",
              promoType === "super"
                ? "bg-white text-purple-600 hover:bg-white/90"
                : "bg-white text-emerald-600 hover:bg-white/90"
            )}
          >
            {dictionary.goToPricing}
          </Link>
        </div>
      </div>
    </div>
  );
}

