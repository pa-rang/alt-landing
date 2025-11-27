"use client";

import { createPortal } from "react-dom";
import Link from "next/link";
import { X, Copy, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { PROMO_THRESHOLD_SCORE, PROMO_CODE, SUPER_PROMO_THRESHOLD_SCORE, SUPER_PROMO_CODE } from "@/lib/apple-game";
import type { Dictionary } from "@/lib/i18n/dictionary";
import { GameScoreSubmit } from "../ScoreSubmit";

type ScoreSubmitModalProps = {
  score: number;
  bestScore: number;
  dictionary: Dictionary["game"];
  promoCodeCopied: boolean;
  onCopyPromoCode: (isSuper: boolean) => void;
  onClose: () => void;
  onSuccess: (data: { nickname: string; organization: string; rank: number }) => void;
};

export function ScoreSubmitModal({
  score,
  bestScore,
  dictionary,
  promoCodeCopied,
  onCopyPromoCode,
  onClose,
  onSuccess,
}: ScoreSubmitModalProps) {
  return createPortal(
    <div className="fixed inset-0 bg-white z-9999 flex flex-col">
      {/* 프로모션 코드 배너 (60점, 100점 달성 시 모달 위에 표시) */}
      {score >= PROMO_THRESHOLD_SCORE && (
        <div
          className={cn(
            "w-full p-3 text-white text-center shrink-0",
            score >= SUPER_PROMO_THRESHOLD_SCORE
              ? "bg-linear-to-r from-purple-600 to-pink-600"
              : "bg-linear-to-r from-emerald-500 to-teal-600"
          )}
        >
          <div className="flex items-center justify-center gap-2 mb-2">
            <span className="text-lg">{score >= SUPER_PROMO_THRESHOLD_SCORE ? "🏆" : "🎉"}</span>
            <span className="font-bold text-sm">
              {score >= SUPER_PROMO_THRESHOLD_SCORE ? dictionary.superPromoToastTitle : dictionary.promoToastTitle}
            </span>
          </div>
          <div className="flex items-center justify-center gap-2 bg-white/20 rounded-lg px-3 py-2 mx-auto w-fit">
            <span className="font-mono font-bold text-sm tracking-wide">
              {score >= SUPER_PROMO_THRESHOLD_SCORE ? SUPER_PROMO_CODE : PROMO_CODE}
            </span>
            <button
              onClick={() => onCopyPromoCode(score >= SUPER_PROMO_THRESHOLD_SCORE)}
              className="p-1 hover:bg-white/20 rounded transition-colors"
            >
              {promoCodeCopied ? <Check className="w-4 h-4 text-white" /> : <Copy className="w-4 h-4 text-white" />}
            </button>
          </div>
          <Link
            href="/pricing"
            className="inline-block mt-2 bg-white text-xs font-bold py-1.5 px-3 rounded-md shadow-sm hover:scale-105 transition-transform"
            style={{ color: score >= SUPER_PROMO_THRESHOLD_SCORE ? "#9333ea" : "#10b981" }}
          >
            {dictionary.goToPricing}
          </Link>
        </div>
      )}

      <div className="relative p-4 text-center border-b shrink-0">
        <button onClick={onClose} className="absolute right-3 top-3 text-gray-400 hover:text-gray-600">
          <X className="w-5 h-5" />
        </button>
        <h2 className="text-lg font-bold text-gray-900">
          {score >= PROMO_THRESHOLD_SCORE ? dictionary.gameOverCongratulations : dictionary.gameOver}
        </h2>
        {score < PROMO_THRESHOLD_SCORE && (
          <p className="text-xs text-gray-500 mt-1">
            {dictionary.gameOverNeedMorePoints.replace("{{points}}", String(PROMO_THRESHOLD_SCORE - score))}
          </p>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <GameScoreSubmit
          score={score}
          bestScore={bestScore}
          dictionary={dictionary.scoreSubmit}
          onSuccess={onSuccess}
        />
      </div>
    </div>,
    document.body
  );
}
