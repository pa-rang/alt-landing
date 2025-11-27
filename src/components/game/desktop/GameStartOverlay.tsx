import { useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Dictionary } from "@/lib/i18n/dictionary";
import type { Cell } from "../shared/types";

type GameStartOverlayProps = {
  bestScore: number;
  bestRank: number;
  organizationRank: number;
  organizationName: string;
  dictionary: Dictionary["game"];
  onStart: () => void;
};

// 데모용 4x4 그리드 값 (합이 10이 되는 조합이 여러 개 있도록 설정)
const DEMO_GRID_VALUES = [
  [1, 2, 3, 4], // 합 = 10 (첫 번째 행)
  [5, 1, 2, 2], // 합 = 10
  [3, 4, 1, 2], // 합 = 10
  [1, 1, 1, 7], // 합 = 10
];

const DEMO_ROWS = 4;
const DEMO_COLS = 4;

// 합이 10이 되는 첫 번째 행의 인덱스 (0, 1, 2, 3)
const HIGHLIGHTED_INDICES = [0, 1, 2, 3];

// 영어 서수 접미사 함수
function getOrdinalSuffix(num: number): string {
  const j = num % 10;
  const k = num % 100;
  if (j === 1 && k !== 11) return "st";
  if (j === 2 && k !== 12) return "nd";
  if (j === 3 && k !== 13) return "rd";
  return "th";
}

// 언어 판단 함수 (dictionary의 guide 키로 판단)
function isEnglish(dictionary: Dictionary["game"]): boolean {
  // guide 키가 영어로 시작하는지 확인
  return dictionary.guide.startsWith("Drag");
}

export function GameStartOverlay({
  bestScore,
  bestRank,
  organizationRank,
  organizationName,
  dictionary,
  onStart,
}: GameStartOverlayProps) {
  const [demoCells] = useState<Cell[]>(() => {
    const values = DEMO_GRID_VALUES.flat();
    return values.map((v, i) => ({ id: i, value: v, removed: false }));
  });

  return (
    <div className="absolute inset-0 backdrop-blur-xs bg-[#d9eeff] flex flex-col items-center justify-center gap-6 p-4 overflow-y-auto">
      <div className="flex flex-row items-center justify-center gap-8 w-full max-w-6xl">
        {/* 왼쪽: 데모 그리드 */}
        <div className="flex flex-col items-center max-w-[200px] gap-3">
          <div
            className={cn("relative bg-green-50 rounded-lg border overflow-hidden select-none", "grid")}
            style={{
              gridTemplateColumns: `repeat(${DEMO_COLS}, 40px)`,
              gridTemplateRows: `repeat(${DEMO_ROWS}, 40px)`,
            }}
          >
            {demoCells.map((cell) => {
              const shouldHighlight = HIGHLIGHTED_INDICES.includes(cell.id);
              return (
                <div
                  key={cell.id}
                  className={cn(
                    "relative flex items-center justify-center border-[0.5px] border-emerald-200 transition-all",
                    cell.removed ? "bg-transparent" : "bg-white",
                    shouldHighlight ? "bg-emerald-200" : ""
                  )}
                >
                  {!cell.removed ? (
                    <div
                      className={cn(
                        "w-10 h-10 flex items-center justify-center text-base font-semibold transition-all will-change-transform relative overflow-hidden rounded-lg",
                        shouldHighlight ? "scale-105 shadow-lg" : ""
                      )}
                    >
                      <Image
                        src="/apple_game_items/gemini_tomato_removebg.png"
                        alt="tomato"
                        fill
                        className="object-contain select-none"
                        unoptimized
                        draggable={false}
                      />
                      <span className="relative z-10 text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.1)]">
                        {cell.value}
                      </span>
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
          <h3 className="text-base text-zinc-950 font-bold text-center mt-2">{dictionary.demoInstruction}</h3>
        </div>

        {/* 오른쪽: 기존 내용 */}
        <div className="flex flex-col items-center gap-6 flex-1">
          <p className="text-xl font-bold text-gray-900 text-center drop-shadow-sm whitespace-pre-wrap">
            {dictionary.promoRequirement}
          </p>

          {/* Stats Display - Only show if user has played before (bestScore > 0) */}
          {bestScore > 0 && (
            <div className="flex gap-3 mb-2 animate-fade-in-up scale-90 sm:scale-100 origin-center">
              <div className="flex flex-col items-center bg-[#9ccbf1] p-3 rounded-xl min-w-[90px]">
                <div className="text-xs text-zinc-900 font-medium mb-1">{dictionary.bestScoreLabel}</div>
                <Image src="/icons/🍅 tomato.svg" width={32} height={32} alt="Best Score" />
                <span className="font-bold text-lg text-emerald-600 mt-1">{bestScore}</span>
              </div>
              {bestRank > 0 && (
                <div className="flex flex-col items-center bg-[#9ccbf1] p-3 rounded-xl min-w-[90px]">
                  <div className="text-xs text-zinc-900 font-medium mb-1">{dictionary.bestRankLabel}</div>
                  <Image src="/icons/🏅 sports_medal.svg" width={32} height={32} alt="Best Rank" />
                  <span className="font-bold text-lg text-blue-600 mt-1">
                    {bestRank}
                    {isEnglish(dictionary) ? getOrdinalSuffix(bestRank) : dictionary.rankSuffix}
                  </span>
                </div>
              )}
              {organizationRank > 0 && (
                <div className="flex flex-col items-center bg-[#9ccbf1] p-3 rounded-xl min-w-[90px]">
                  <div
                    className="text-xs text-zinc-900 font-medium mb-1 truncate max-w-[80px]"
                    title={organizationName}
                  >
                    {organizationName || dictionary.organizationRankLabel}
                  </div>
                  <Image src="/icons/🏆️ trophy.svg" width={32} height={32} alt="Organization Rank" />
                  <span className="font-bold text-lg text-amber-500 mt-1">
                    {organizationRank}
                    {isEnglish(dictionary) ? getOrdinalSuffix(organizationRank) : dictionary.rankSuffix}
                  </span>
                </div>
              )}
            </div>
          )}

          <Button size="lg" onClick={onStart} className="text-lg px-8 py-6 shadow-lg">
            {dictionary.start}
          </Button>
        </div>
      </div>
    </div>
  );
}
