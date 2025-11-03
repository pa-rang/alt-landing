"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  TOMATO_COLS as COLS,
  TOMATO_ROWS as ROWS,
  GAME_SECONDS,
  DOWNLOAD_THRESHOLD_SCORE,
  computeSelectedIndicesFromRect,
  formatTime,
  generateValues,
} from "@/lib/apple-game";
import type { Dictionary } from "@/lib/i18n/dictionary";
import { GameScoreSubmit } from "./ScoreSubmit";
import { LeaderboardBox } from "./LeaderboardBox";
import { DownloadButton } from "./DownloadButton";

// GA4 이벤트 추적 함수들
function trackGameStart() {
  if (typeof window !== "undefined" && window.gtag) {
    window.gtag("event", "game_start", {
      event_category: "game",
      event_label: "game_play_start",
      timestamp: new Date().toISOString(),
    });
  }
}

function trackGameRetry() {
  if (typeof window !== "undefined" && window.gtag) {
    window.gtag("event", "game_retry", {
      event_category: "game",
      event_label: "game_retry_during_play",
      timestamp: new Date().toISOString(),
    });
  }
}

function trackGameRestart() {
  if (typeof window !== "undefined" && window.gtag) {
    window.gtag("event", "game_restart", {
      event_category: "game",
      event_label: "game_restart_after_end",
      timestamp: new Date().toISOString(),
    });
  }
}

const BEST_SCORE_KEY = "squareTomatoGameBestScore";

type ScoreDisplayProps = {
  gameState: "idle" | "running" | "ended";
  currentScore: number;
  bestScore: number;
  scoreLabel: string;
};

function ScoreDisplay({ gameState, currentScore, bestScore, scoreLabel }: ScoreDisplayProps) {
  if (gameState === "idle") {
    // 게임 시작 전: BEST 점수만 표시
    return (
      <span className="px-3 py-1 rounded-md bg-blue-100 text-blue-800">
        BEST <b>{bestScore > 0 ? bestScore : 0}</b>
      </span>
    );
  }

  // 게임 진행 중: 현재 점수만 표시
  return (
    <span className="px-3 py-1 rounded-md bg-gray-100">
      {scoreLabel} <b>{currentScore}</b>
    </span>
  );
}

type SquareTomatoGameProps = {
  onClose: () => void;
  dictionary: Dictionary["game"];
};

type Cell = {
  id: number;
  value: number;
  removed: boolean;
};

export function SquareTomatoGame({ onClose, dictionary }: SquareTomatoGameProps) {
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

  const [showScoreSubmit, setShowScoreSubmit] = useState(false);
  const [submittedData, setSubmittedData] = useState<{
    email: string;
    organization: string;
    rank: number;
  } | null>(null);

  const [bestScore, setBestScore] = useState<number>(0);
  const [leaderboardRefreshTrigger, setLeaderboardRefreshTrigger] = useState<number>(0);

  // 최고점수 로컬스토리지에서 불러오기
  useEffect(() => {
    const savedScore = localStorage.getItem(BEST_SCORE_KEY);
    if (savedScore) {
      setBestScore(parseInt(savedScore, 10));
    }
  }, []);

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

  // 게임 종료 시 최고점수 업데이트
  useEffect(() => {
    if (gameState === "ended") {
      if (score > bestScore) {
        setBestScore(score);
        localStorage.setItem(BEST_SCORE_KEY, String(score));
      }
    }
  }, [gameState, score, bestScore]);

  // DOWNLOAD_THRESHOLD_SCORE 이상일 때 confetti 발사
  useEffect(() => {
    if (showScoreSubmit && score >= DOWNLOAD_THRESHOLD_SCORE) {
      console.log("🎉 Confetti 발사! 점수:", score, "기준점수:", DOWNLOAD_THRESHOLD_SCORE);
      // 모달이 열린 후 confetti 발사하도록 짧은 딜레이 추가
      const timer = setTimeout(async () => {
        const confetti = (await import("canvas-confetti")).default;
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
          zIndex: 9999,
        });
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [showScoreSubmit, score]);

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
      // GA4 이벤트 추적
      trackGameStart();
      resetGame();
      setGameState("running");
    }
  }, [gameState, resetGame]);

  const handleScoreSubmitSuccess = useCallback((data: { email: string; organization: string; rank: number }) => {
    setSubmittedData({ email: data.email, organization: data.organization, rank: data.rank });
    setShowScoreSubmit(false);
    // 리더보드 새로고침
    setLeaderboardRefreshTrigger((prev) => prev + 1);
  }, []);

  return (
    <div className="absolute inset-0 bg-black/80 flex items-center justify-center animate-fade-in p-4 overflow-y-auto">
      <div className="max-w-7xl rounded-xl shadow-xl flex flex-col my-auto max-h-[calc(100vh-2rem)] w-full">
        <div className="flex items-center justify-between px-4 sm:px-4 py-3">
          <div className="font-semibold text-lg sm:text-xl text-white">
            {dictionary.title.replace("{{threshold}}", String(DOWNLOAD_THRESHOLD_SCORE))}
          </div>
          <div className="flex items-center gap-2">
            {score >= DOWNLOAD_THRESHOLD_SCORE && (
              <DownloadButton className="text-gray-900 bg-white hover:bg-white/80" />
            )}
            <Button className="text-white bg-white/15" onClick={onClose}>
              {dictionary.close}
            </Button>
          </div>
        </div>

        {/* 게임 박스와 리더보드 박스 */}
        <div className="flex flex-col lg:flex-row gap-4 p-4 overflow-auto flex-1">
          {/* 게임 박스 */}
          <div className="flex-1 bg-white rounded-lg border shadow-sm flex flex-col">
            <div className="px-4 py-3 border-b">
              <h3 className="font-semibold text-lg">{dictionary.tabs.game}</h3>
            </div>
            <div className="px-4 py-3 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 text-sm sm:text-base flex-1">
                <ScoreDisplay
                  gameState={gameState}
                  currentScore={score}
                  bestScore={bestScore}
                  scoreLabel={dictionary.scoreLabel}
                />
                <div className="flex-1 flex items-center gap-2">
                  <span className="text-sm whitespace-nowrap">{dictionary.timeLabel}</span>
                  <span
                    className="text-sm font-bold whitespace-nowrap min-w-[3ch]"
                    onDoubleClick={() => {
                      if (gameState === "running") {
                        setTimeLeft(5);
                      }
                    }}
                  >
                    {formatTime(timeLeft)}
                  </span>
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
                  <Button
                    variant="default"
                    onClick={() => {
                      trackGameRetry();
                      resetGame();
                    }}
                  >
                    {dictionary.retry}
                  </Button>
                )}
                {gameState === "ended" && (
                  <Button
                    variant="default"
                    onClick={() => {
                      trackGameRestart();
                      resetGame();
                    }}
                  >
                    {dictionary.restart}
                  </Button>
                )}
              </div>
            </div>

            <div className="px-4 pb-5 overflow-auto flex-1">
              <div
                ref={boardRef}
                className={cn(
                  "relative bg-green-50 rounded-lg border overflow-hidden select-none mx-auto w-fit",
                  "grid"
                )}
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
                          "w-10 h-10 flex items-center justify-center text-base sm:text-lg font-semibold transition-transform will-change-transform relative overflow-hidden rounded-lg",
                          sumIsTen && isDragging && selectedIndices.includes(cell.id) ? "scale-105" : ""
                        )}
                      >
                        <Image
                          src="/apple_game_items/gemini_tomato_removebg.png"
                          alt="tomato"
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
                      {dictionary.downloadRequirement.replace("{{threshold}}", String(DOWNLOAD_THRESHOLD_SCORE))}
                    </p>
                    <Button size="lg" onClick={handleStart} className="text-lg px-8 py-6 shadow-lg">
                      {dictionary.start}
                    </Button>
                    <p className="text-base text-gray-800 text-center px-4 max-w-md font-medium leading-relaxed">
                      {dictionary.guide}
                    </p>
                  </div>
                )}
              </div>

              {/* 가이드 텍스트 */}
              <div className="mt-3 text-xs sm:text-sm text-gray-600">{dictionary.guide}</div>
            </div>

            {/* 점수 제출 모달 */}
            {gameState === "ended" && showScoreSubmit && (
              <div className="absolute inset-0 bg-black/60 flex items-center justify-center p-4 z-10">
                <div className="bg-white rounded-xl p-6 sm:p-8 shadow-xl max-w-md w-full relative">
                  {/* 닫기 버튼 (오른쪽 위) */}
                  <button
                    onClick={() => setShowScoreSubmit(false)}
                    className="absolute top-2 right-2 p-1 rounded-full border border-gray-300 hover:bg-gray-100 transition-colors"
                    aria-label="Close"
                  >
                    <X className="w-3 h-3 text-gray-500" />
                  </button>

                  <div className="text-xl sm:text-2xl font-bold mb-2 text-center">
                    {score >= DOWNLOAD_THRESHOLD_SCORE ? (
                      <>{dictionary.gameOverCongratulations}</>
                    ) : (
                      <>
                        {dictionary.gameOverNeedMorePoints.replace(
                          "{{points}}",
                          String(DOWNLOAD_THRESHOLD_SCORE - score)
                        )}
                      </>
                    )}
                  </div>
                  {score < DOWNLOAD_THRESHOLD_SCORE && (
                    <div className="text-sm text-gray-600 mb-3 text-center">{dictionary.gameOverTip}</div>
                  )}
                  <GameScoreSubmit
                    score={score}
                    bestScore={bestScore}
                    dictionary={dictionary.scoreSubmit}
                    onSuccess={handleScoreSubmitSuccess}
                  />
                  <p className="mt-1 text-xs text-gray-600 text-right">{dictionary.scoreSubmit.leaderboardHint}</p>
                </div>
              </div>
            )}
          </div>

          {/* 리더보드 박스 */}
          <div className="flex-1">
            <LeaderboardBox
              dictionary={dictionary}
              userEmail={submittedData?.email}
              userOrganization={submittedData?.organization}
              refreshTrigger={leaderboardRefreshTrigger}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
