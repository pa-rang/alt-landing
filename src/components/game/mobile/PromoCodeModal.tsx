"use client";

import { createPortal } from "react-dom";
import Link from "next/link";
import { X, Copy, Check } from "lucide-react";
import { PROMO_CODE, SUPER_PROMO_CODE } from "@/lib/apple-game";
import type { Dictionary } from "@/lib/i18n/dictionary";

type PromoCodeModalProps = {
  dictionary: Dictionary["game"];
  hasUnlockedPromo: boolean;
  hasUnlockedSuperPromo: boolean;
  promoCodeCopied: boolean;
  onCopyPromoCode: (isSuper: boolean) => void;
  onClose: () => void;
};

export function PromoCodeModal({
  dictionary,
  hasUnlockedPromo,
  hasUnlockedSuperPromo,
  promoCodeCopied,
  onCopyPromoCode,
  onClose,
}: PromoCodeModalProps) {
  return createPortal(
    <div className="fixed inset-0 bg-white z-9999 flex flex-col">
      <div className="relative p-4 text-center border-b shrink-0">
        <button
          onClick={onClose}
          className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
        >
          <X className="w-5 h-5" />
        </button>
        <h2 className="text-lg font-bold text-gray-900">{dictionary.promoCodeTitle}</h2>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {hasUnlockedSuperPromo && (
          <div className="bg-linear-to-r from-purple-600 to-pink-600 rounded-lg p-4 text-white">
            <div className="flex items-center justify-center gap-2 mb-3">
              <span className="text-2xl">🏆</span>
              <h3 className="font-bold text-lg">{dictionary.superPromoToastTitle}</h3>
            </div>
            <p className="text-sm mb-3 text-white/90">{dictionary.superPromoToastDescription}</p>
            <div className="flex items-center justify-center gap-2 bg-white/20 rounded-lg px-4 py-3">
              <span className="font-mono font-bold text-lg tracking-wide">{SUPER_PROMO_CODE}</span>
              <button
                onClick={() => onCopyPromoCode(true)}
                className="p-1.5 hover:bg-white/20 rounded transition-colors"
              >
                {promoCodeCopied ? (
                  <Check className="w-5 h-5 text-white" />
                ) : (
                  <Copy className="w-5 h-5 text-white" />
                )}
              </button>
            </div>
            <Link
              href="/pricing"
              className="inline-block mt-3 bg-white text-purple-600 hover:bg-white/90 font-semibold shadow-lg hover:scale-105 transition-transform px-4 py-2 rounded-lg text-sm"
            >
              {dictionary.goToPricing}
            </Link>
          </div>
        )}

        {hasUnlockedPromo && (
          <div className="bg-linear-to-r from-emerald-500 to-teal-600 rounded-lg p-4 text-white">
            <div className="flex items-center justify-center gap-2 mb-3">
              <span className="text-2xl">🎉</span>
              <h3 className="font-bold text-lg">{dictionary.promoToastTitle}</h3>
            </div>
            <p className="text-sm mb-3 text-white/90">{dictionary.promoCodeDescription}</p>
            <div className="flex items-center justify-center gap-2 bg-white/20 rounded-lg px-4 py-3">
              <span className="font-mono font-bold text-lg tracking-wide">{PROMO_CODE}</span>
              <button
                onClick={() => onCopyPromoCode(false)}
                className="p-1.5 hover:bg-white/20 rounded transition-colors"
              >
                {promoCodeCopied ? (
                  <Check className="w-5 h-5 text-white" />
                ) : (
                  <Copy className="w-5 h-5 text-white" />
                )}
              </button>
            </div>
            <Link
              href="/pricing"
              className="inline-block mt-3 bg-white text-emerald-600 hover:bg-white/90 font-semibold shadow-lg hover:scale-105 transition-transform px-4 py-2 rounded-lg text-sm"
            >
              {dictionary.goToPricing}
            </Link>
          </div>
        )}

        {!hasUnlockedPromo && !hasUnlockedSuperPromo && (
          <div className="text-center py-8">
            <p className="text-gray-600 mb-2">{dictionary.noPromoCode}</p>
            <p className="text-sm text-gray-500">
              {dictionary.promoCodeRequirement}
            </p>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}

