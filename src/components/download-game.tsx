"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  TOMATO_COLS as COLS,
  TOMATO_ROWS as ROWS,
  GAME_SECONDS,
  computeSelectedIndicesFromRect,
  formatTime,
  generateValues,
} from "@/lib/apple-game";
import type { Dictionary } from "@/lib/i18n/dictionary";
import type { Locale } from "@/lib/i18n/config";
import { GameScoreSubmit } from "@/components/game-score-submit";
import { GameLeaderboard } from "@/components/game-leaderboard";

type DownloadGameProps = {
  onClose: () => void;
  locale: Locale;
  dictionary: Dictionary["game"];
};

type Cell = {
  id: number;
  value: number;
  removed: boolean;
};

type TabType = "game" | "personalLeaderboard" | "organizationLeaderboard";

export function DownloadGame({ onClose, locale, dictionary }: DownloadGameProps) {
  const boardRef = useRef<HTMLDivElement | null>(null);

  const [cells, setCells] = useState<Cell[]>(() => {
    const values = generateValues(ROWS, COLS);
    return values.map((v, i) => ({ id: i, value: v, removed: false }));
  });
  const [score, setScore] = useState<number>(0);
  const [timeLeft, setTimeLeft] = useState<number>(GAME_SECONDS);
  const [gameState, setGameState] = useState<"idle" | "running" | "ended">("idle");

  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [startPos, setStartPos] = useState<{ x: number; y: number } | null>(null);
  const [currentPos, setCurrentPos] = useState<{ x: number; y: number } | null>(null);
  const [selectedIndices, setSelectedIndices] = useState<number[]>([]);

  const [activeTab, setActiveTab] = useState<TabType>("game");
  const [showScoreSubmit, setShowScoreSubmit] = useState(false);
  const [submittedData, setSubmittedData] = useState<{
    email: string;
    organization: string;
    rank: number;
  } | null>(null);

  const resetGame = useCallback(() => {
    const values = generateValues(ROWS, COLS);
    setCells(values.map((v, i) => ({ id: i, value: v, removed: false })));
    setScore(0);
    setTimeLeft(GAME_SECONDS);
    setGameState("idle");
    setIsDragging(false);
    setStartPos(null);
    setCurrentPos(null);
    setSelectedIndices([]);
    setShowScoreSubmit(false);
  }, []);

  // 타이머
  useEffect(() => {
    if (gameState !== "running") return;
    if (timeLeft <= 0) return;
    const timer = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(timer);
          setGameState("ended");
          setShowScoreSubmit(true);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [gameState, timeLeft]);

  const selectionSum = useMemo(() => {
    return selectedIndices.reduce((acc, idx) => {
      const cell = cells[idx];
      if (!cell || cell.removed) return acc;
      return acc + cell.value;
    }, 0);
  }, [selectedIndices, cells]);

  const handlePointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (gameState !== "running") return;
      if (!boardRef.current) return;
      const rect = boardRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      setIsDragging(true);
      setStartPos({ x, y });
      setCurrentPos({ x, y });
      setSelectedIndices([]);
      try {
        (e.currentTarget as HTMLDivElement).setPointerCapture(e.pointerId);
      } catch {}
    },
    [gameState]
  );

  const computeSelectedIndices = useCallback(
    (x1: number, y1: number, x2: number, y2: number) => {
      if (!boardRef.current) return [] as number[];
      const rect = boardRef.current.getBoundingClientRect();
      const removedMask = cells.map((c) => c.removed);
      return computeSelectedIndicesFromRect(rect.width, rect.height, x1, y1, x2, y2, ROWS, COLS, removedMask);
    },
    [cells]
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!isDragging || !boardRef.current || !startPos) return;
      const rect = boardRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      setCurrentPos({ x, y });
      const inds = computeSelectedIndices(startPos.x, startPos.y, x, y);
      setSelectedIndices(inds);
    },
    [isDragging, startPos, computeSelectedIndices]
  );

  const clearSelection = useCallback(() => {
    setIsDragging(false);
    setStartPos(null);
    setCurrentPos(null);
    setSelectedIndices([]);
  }, []);

  const handlePointerUp = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!isDragging) return;
      if (selectionSum === 10 && selectedIndices.length > 0) {
        setCells((prev) => {
          const next = prev.slice();
          selectedIndices.forEach((idx) => {
            if (next[idx]) next[idx] = { ...next[idx], removed: true };
          });
          return next;
        });
        setScore((s) => s + selectedIndices.length);
      }
      clearSelection();
      try {
        (e.currentTarget as HTMLDivElement).releasePointerCapture(e.pointerId);
      } catch {}
    },
    [isDragging, selectionSum, selectedIndices, clearSelection]
  );

  const selectionRect = useMemo(() => {
    if (!isDragging || !startPos || !currentPos)
      return null as null | {
        left: number;
        top: number;
        width: number;
        height: number;
      };
    const left = Math.min(startPos.x, currentPos.x);
    const top = Math.min(startPos.y, currentPos.y);
    const width = Math.abs(startPos.x - currentPos.x);
    const height = Math.abs(startPos.y - currentPos.y);
    return { left, top, width, height };
  }, [isDragging, startPos, currentPos]);

  const sumIsTen = selectionSum === 10 && selectedIndices.length > 0;

  const handleStart = useCallback(() => {
    if (gameState === "idle") {
      resetGame();
      setGameState("running");
      setActiveTab("game");
    }
  }, [gameState, resetGame]);

  const handleScoreSubmitSuccess = useCallback(
    (data: { email: string; organization: string; rank: number }) => {
      setSubmittedData(data);
      setShowScoreSubmit(false);
      setActiveTab("personalLeaderboard");
    },
    []
  );

  return (
    <div className="absolute inset-0 bg-black/80 flex items-center justify-center animate-fade-in p-4 overflow-y-auto">
      <div className="max-w-6xl bg-white rounded-xl shadow-xl flex flex-col my-auto max-h-[calc(100vh-2rem)] w-full">
        <div className="flex items-center justify-between px-4 sm:px-6 py-3 border-b">
          <div className="font-semibold text-lg sm:text-xl">{dictionary.title}</div>
          <div className="flex items-center gap-2">
            <Button variant="secondary" onClick={onClose}>
              {dictionary.close}
            </Button>
          </div>
        </div>

        {/* 탭 네비게이션 */}
        <div className="flex border-b">
          <button
            onClick={() => setActiveTab("game")}
            className={cn(
              "flex-1 px-4 py-3 text-sm font-medium transition-colors",
              activeTab === "game"
                ? "border-b-2 border-blue-600 text-blue-600"
                : "text-gray-600 hover:text-gray-900"
            )}
          >
            {dictionary.tabs.game}
          </button>
          <button
            onClick={() => setActiveTab("personalLeaderboard")}
            className={cn(
              "flex-1 px-4 py-3 text-sm font-medium transition-colors",
              activeTab === "personalLeaderboard"
                ? "border-b-2 border-blue-600 text-blue-600"
                : "text-gray-600 hover:text-gray-900"
            )}
          >
            {dictionary.tabs.personalLeaderboard}
          </button>
          <button
            onClick={() => setActiveTab("organizationLeaderboard")}
            className={cn(
              "flex-1 px-4 py-3 text-sm font-medium transition-colors",
              activeTab === "organizationLeaderboard"
                ? "border-b-2 border-blue-600 text-blue-600"
                : "text-gray-600 hover:text-gray-900"
            )}
          >
            {dictionary.tabs.organizationLeaderboard}
          </button>
        </div>

        {/* 게임 탭 */}
        {activeTab === "game" && (
          <>
            <div className="px-4 sm:px-6 py-3 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 text-sm sm:text-base flex-1">
                <span className="px-3 py-1 rounded-md bg-gray-100">
                  {dictionary.scoreLabel} <b>{score}</b>
                </span>
                <div className="flex-1 flex items-center gap-2">
                  <span className="text-sm whitespace-nowrap">{dictionary.timeLabel}</span>
                  <span className="text-sm font-bold whitespace-nowrap min-w-[3ch]">{formatTime(timeLeft)}</span>
                  <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden relative min-w-[80px]">
                    <div
                      className={cn(
                        "h-full transition-all duration-300 ease-linear",
                        timeLeft > 30 ? "bg-emerald-500" : timeLeft > 10 ? "bg-yellow-500" : "bg-red-500"
                      )}
                      style={{
                        width: `${(timeLeft / GAME_SECONDS) * 100}%`,
                      }}
                    />
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {gameState === "running" && (
                  <Button variant="outline" onClick={resetGame}>
                    {dictionary.retry}
                  </Button>
                )}
              </div>
            </div>

            <div className="px-4 sm:px-6 pb-5 overflow-auto">
              <div
                ref={boardRef}
                className={cn("relative bg-green-50 rounded-lg border overflow-hidden select-none mx-auto w-fit", "grid")}
                style={{
                  gridTemplateColumns: `repeat(${COLS}, 40px)`,
                  gridTemplateRows: `repeat(${ROWS}, 40px)`,
                  touchAction: "none",
                  WebkitUserSelect: "none",
                  userSelect: "none",
                }}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerLeave={handlePointerUp}
              >
                {cells.map((cell) => (
                  <div
                    key={cell.id}
                    className={cn(
                      "relative flex items-center justify-center border-[0.5px] border-emerald-200",
                      cell.removed ? "bg-transparent" : "bg-white"
                    )}
                  >
                    {!cell.removed ? (
                      <div
                        className={cn(
                          "w-10 h-10 rounded-full flex items-center justify-center text-base sm:text-lg font-semibold transition-transform will-change-transform relative overflow-hidden",
                          sumIsTen && isDragging && selectedIndices.includes(cell.id) ? "scale-105" : ""
                        )}
                      >
                        <Image
                          src="/apple_game_items/gemini_tomato_removebg.png"
                          alt="melon"
                          fill
                          className="object-cover select-none"
                          unoptimized
                          draggable={false}
                        />
                        <span className="relative z-10 text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.1)]">
                          {cell.value}
                        </span>
                      </div>
                    ) : null}
                  </div>
                ))}

                {/* 드래그 박스 */}
                {selectionRect ? (
                  <div
                    className={cn(
                      "absolute border-2 pointer-events-none",
                      sumIsTen ? "border-emerald-500 bg-emerald-500/10" : "border-yellow-500 bg-yellow-500/10"
                    )}
                    style={{
                      left: selectionRect.left,
                      top: selectionRect.top,
                      width: selectionRect.width,
                      height: selectionRect.height,
                    }}
                  />
                ) : null}

                {/* 시작 버튼 오버레이 */}
                {gameState === "idle" && (
                  <div className="absolute inset-0 backdrop-blur-xs bg-white/60 flex flex-col items-center justify-center gap-6">
                    <p className="text-xl font-bold text-gray-900 text-center px-4 drop-shadow-sm">
                      {dictionary.downloadRequirement}
                    </p>
                    <Button size="lg" onClick={handleStart} className="text-lg px-8 py-6 shadow-lg">
                      {dictionary.start}
                    </Button>
                    <p className="text-base text-gray-800 text-center px-4 max-w-md font-medium leading-relaxed">
                      {dictionary.rules}
                    </p>
                  </div>
                )}
              </div>

              {/* 가이드 텍스트 */}
              <div className="mt-3 text-xs sm:text-sm text-gray-600">{dictionary.guide}</div>
            </div>

            {/* 점수 제출 모달 */}
            {gameState === "ended" && showScoreSubmit && (
              <div className="absolute inset-0 bg-black/60 flex items-center justify-center p-4">
                <div className="bg-white rounded-xl p-6 sm:p-8 shadow-xl max-w-md w-full">
                  <div className="text-xl sm:text-2xl font-bold mb-2 text-center">{dictionary.gameOver}</div>
                  <div className="text-base sm:text-lg mb-6 text-center">
                    {dictionary.finalScore}: <b>{score}</b>
                  </div>
                  <GameScoreSubmit score={score} dictionary={dictionary.scoreSubmit} onSuccess={handleScoreSubmitSuccess} />
                </div>
              </div>
            )}
          </>
        )}

        {/* 개인 리더보드 탭 */}
        {activeTab === "personalLeaderboard" && (
          <div className="px-4 sm:px-6 py-4 overflow-auto flex-1">
            <GameLeaderboard
              type="personal"
              dictionary={dictionary.leaderboard}
              userEmail={submittedData?.email}
            />
          </div>
        )}

        {/* 학교/직장 리더보드 탭 */}
        {activeTab === "organizationLeaderboard" && (
          <div className="px-4 sm:px-6 py-4 overflow-auto flex-1">
            <GameLeaderboard
              type="organization"
              dictionary={dictionary.leaderboard}
              userOrganization={submittedData?.organization}
            />
          </div>
        )}
      </div>
    </div>
  );
}
