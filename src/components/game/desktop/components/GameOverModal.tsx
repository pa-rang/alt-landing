"use client";

import { X } from "lucide-react";
import { PROMO_THRESHOLD_SCORE, SUPER_PROMO_THRESHOLD_SCORE } from "@/lib/apple-game";
import { GameScoreSubmit } from "../../ScoreSubmit";
import type { Dictionary } from "@/lib/i18n/dictionary";

type GameOverModalProps = {
  score: number;
  bestScore: number;
  dictionary: Dictionary["game"];
  onClose: () => void;
  onSubmitSuccess: (data: { nickname: string; organization: string; rank: number }) => void;
};

export function GameOverModal({
  score,
  bestScore,
  dictionary,
  onClose,
  onSubmitSuccess,
}: GameOverModalProps) {
  return (
    <div className="absolute inset-0 bg-black/60 flex items-center justify-center p-4 z-10">
      <div className="bg-white rounded-xl p-6 sm:p-8 shadow-xl max-w-md w-full relative">
        {/* 닫기 버튼 (오른쪽 위) */}
        <button
          onClick={onClose}
          className="absolute top-2 right-2 p-1 rounded-full border border-gray-300 hover:bg-gray-100 transition-colors"
          aria-label="Close"
        >
          <X className="w-3 h-3 text-gray-500" />
        </button>

        <div className="text-xl sm:text-2xl font-bold mb-2 text-center">
          {score >= PROMO_THRESHOLD_SCORE ? (
            <>{dictionary.gameOverCongratulations}</>
          ) : (
            <>
              {dictionary.gameOverNeedMorePoints.replace("{{points}}", String(PROMO_THRESHOLD_SCORE - score))}
            </>
          )}
        </div>
        {/* 프로모션 코드 획득 시 코드 대신 안내 문구 표시 */}
        {score >= PROMO_THRESHOLD_SCORE && (
          <div className="mb-4 p-4 bg-emerald-50 rounded-xl border border-emerald-200 text-center animate-pulse">
            <p className="font-bold text-emerald-800 text-lg mb-1">{dictionary.checkToast}</p>
            <p className="text-sm text-emerald-600">
              {score >= SUPER_PROMO_THRESHOLD_SCORE
                ? dictionary.superPromoToastDescription
                : dictionary.promoCodeDescription}
            </p>
          </div>
        )}
        {score < PROMO_THRESHOLD_SCORE && (
          <div className="text-sm text-gray-600 mb-3 text-center">{dictionary.gameOverTip}</div>
        )}
        <GameScoreSubmit
          score={score}
          bestScore={bestScore}
          dictionary={dictionary.scoreSubmit}
          onSuccess={onSubmitSuccess}
        />
        <p className="mt-1 text-xs text-gray-600 text-right">{dictionary.scoreSubmit.leaderboardHint}</p>
      </div>
    </div>
  );
}

