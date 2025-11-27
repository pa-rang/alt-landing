"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  TOMATO_COLS as COLS,
  TOMATO_ROWS as ROWS,
  GAME_SECONDS,
  PROMO_THRESHOLD_SCORE,
  PROMO_CODE,
  SUPER_PROMO_THRESHOLD_SCORE,
  SUPER_PROMO_CODE,
  computeSelectedIndicesFromRect,
  formatTime,
  generateValues,
} from "@/lib/apple-game";
import type { Dictionary } from "@/lib/i18n/dictionary";
import { GameScoreSubmit } from "../ScoreSubmit";
import { LeaderboardBox } from "../LeaderboardBox";
import { VolumeControl } from "../VolumeControl";
import { Copy, Check } from "lucide-react";
import { trackGameStart, trackGameRetry, trackGameRestart } from "../shared/tracking";
import { BEST_SCORE_KEY, PROMO_UNLOCKED_KEY, SUPER_PROMO_UNLOCKED_KEY } from "../shared/constants";
import { ScoreDisplay } from "./ScoreDisplay";
import { TimeProgressBar } from "../shared/TimeProgressBar";
import type { Cell } from "../shared/types";

type SquareTomatoGameProps = {
  onClose: () => void;
  dictionary: Dictionary["game"];
};

export function SquareTomatoGame({ onClose, dictionary }: SquareTomatoGameProps) {
  const boardRef = useRef<HTMLDivElement | null>(null);
  const bgmRef = useRef<HTMLAudioElement | null>(null);
  const clearSfxRef = useRef<HTMLAudioElement | null>(null);

  // BGM 초기화
  useEffect(() => {
    bgmRef.current = new Audio("/tomato-game-bgm.wav");
    bgmRef.current.loop = true;
    bgmRef.current.volume = 0.3;

    // 클리어 효과음 초기화
    clearSfxRef.current = new Audio("/tomato-clear-bgm.wav");
    clearSfxRef.current.volume = 0.5;

    return () => {
      if (bgmRef.current) {
        bgmRef.current.pause();
        bgmRef.current = null;
      }
      clearSfxRef.current = null;
    };
  }, []);

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
    nickname: string;
    organization: string;
    rank: number;
  } | null>(null);

  const [bestScore, setBestScore] = useState<number>(0);
  const [leaderboardRefreshTrigger, setLeaderboardRefreshTrigger] = useState<number>(0);
  const [hasUnlockedPromo, setHasUnlockedPromo] = useState<boolean>(false);
  const [hasUnlockedSuperPromo, setHasUnlockedSuperPromo] = useState<boolean>(false);
  const [isPromoBannerVisible, setIsPromoBannerVisible] = useState<boolean>(false);
  const [promoCodeCopied, setPromoCodeCopied] = useState<boolean>(false);
  const promoBannerRef = useRef<HTMLDivElement>(null);
  const promoBannerButtonRef = useRef<HTMLButtonElement>(null);
  const [titleClickTimestamps, setTitleClickTimestamps] = useState<number[]>([]);
  const [timeClickTimestamps, setTimeClickTimestamps] = useState<number[]>([]);

  // BGM 볼륨 상태
  const [bgmVolume, setBgmVolume] = useState<number>(0.3);
  const [isMuted, setIsMuted] = useState<boolean>(false);

  // 게임 상태에 따라 BGM 재생/중지
  useEffect(() => {
    if (!bgmRef.current) return;

    if (gameState === "running") {
      bgmRef.current.play().catch(() => {
        // 자동 재생 차단 시 무시
      });
    } else {
      bgmRef.current.pause();
      bgmRef.current.currentTime = 0;
    }
  }, [gameState]);

  // 볼륨 및 음소거 상태 동기화
  useEffect(() => {
    if (bgmRef.current) {
      bgmRef.current.volume = isMuted ? 0 : bgmVolume;
    }
  }, [bgmVolume, isMuted]);

  // 최고점수 및 프로모션 코드 해제 상태 로컬스토리지에서 불러오기
  useEffect(() => {
    const savedScore = localStorage.getItem(BEST_SCORE_KEY);
    if (savedScore) {
      setBestScore(parseInt(savedScore, 10));
    }
    const unlocked = localStorage.getItem(PROMO_UNLOCKED_KEY);
    if (unlocked === "true") {
      setHasUnlockedPromo(true);
    }
    const superUnlocked = localStorage.getItem(SUPER_PROMO_UNLOCKED_KEY);
    if (superUnlocked === "true") {
      setHasUnlockedSuperPromo(true);
    }
  }, []);

  // 배너 외부 클릭 감지
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        isPromoBannerVisible &&
        promoBannerRef.current &&
        !promoBannerRef.current.contains(event.target as Node) &&
        promoBannerButtonRef.current &&
        !promoBannerButtonRef.current.contains(event.target as Node)
      ) {
        setIsPromoBannerVisible(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isPromoBannerVisible]);

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
    setTitleClickTimestamps([]);
    setTimeClickTimestamps([]);
    // 토스트는 로컬스토리지 상태에 따라 유지
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

  // 게임 종료 시 최고점수 업데이트 및 프로모션 코드 해제 확인
  useEffect(() => {
    if (gameState === "ended") {
      if (score > bestScore) {
        setBestScore(score);
        localStorage.setItem(BEST_SCORE_KEY, String(score));
      }

      // 슈퍼 프로모션 (100점 이상) 체크
      if (score >= SUPER_PROMO_THRESHOLD_SCORE && !hasUnlockedSuperPromo) {
        setHasUnlockedSuperPromo(true);
        localStorage.setItem(SUPER_PROMO_UNLOCKED_KEY, "true");
        // 일반 프로모션도 같이 해제 처리 (없다면)
        if (!hasUnlockedPromo) {
          setHasUnlockedPromo(true);
          localStorage.setItem(PROMO_UNLOCKED_KEY, "true");
        }
      }
      // 일반 프로모션 (60점 이상) 체크
      else if (score >= PROMO_THRESHOLD_SCORE && !hasUnlockedPromo) {
        setHasUnlockedPromo(true);
        localStorage.setItem(PROMO_UNLOCKED_KEY, "true");
      }
    }
  }, [gameState, score, bestScore, hasUnlockedPromo, hasUnlockedSuperPromo]);

  // PROMO_THRESHOLD_SCORE 이상일 때 confetti 발사
  useEffect(() => {
    if (showScoreSubmit && score >= PROMO_THRESHOLD_SCORE) {
      console.log("🎉 Confetti 발사! 점수:", score, "기준점수:", PROMO_THRESHOLD_SCORE);
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
        // 클리어 효과음 재생
        if (clearSfxRef.current && !isMuted) {
          clearSfxRef.current.currentTime = 0;
          clearSfxRef.current.volume = bgmVolume;
          clearSfxRef.current.play().catch(() => {});
        }
      }
      clearSelection();
      try {
        (e.currentTarget as HTMLDivElement).releasePointerCapture(e.pointerId);
      } catch {}
    },
    [isDragging, selectionSum, selectedIndices, clearSelection, isMuted, bgmVolume]
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
      trackGameStart("desktop");
      resetGame();
      setGameState("running");
    }
  }, [gameState, resetGame]);

  const handleScoreSubmitSuccess = useCallback((data: { nickname: string; organization: string; rank: number }) => {
    setSubmittedData({ nickname: data.nickname, organization: data.organization, rank: data.rank });
    setShowScoreSubmit(false);
    // 리더보드 새로고침
    setLeaderboardRefreshTrigger((prev) => prev + 1);
  }, []);

  // 게임 닫기 핸들러 (BGM 중지 후 닫기)
  const handleClose = useCallback(() => {
    if (bgmRef.current) {
      bgmRef.current.pause();
    }
    onClose();
  }, [onClose]);

  // 공통 연속 클릭 핸들러 (3번 연속 클릭 감지)
  const createTripleClickHandler = useCallback(
    (
      timestamps: number[],
      setTimestamps: React.Dispatch<React.SetStateAction<number[]>>,
      onTripleClick: () => void
    ) => {
      return () => {
        if (gameState !== "running") return;

        const now = Date.now();
        const recentClicks = timestamps.filter((ts) => now - ts < 2000); // 2초 이내 클릭만 카운트

        if (recentClicks.length >= 2) {
          // 세 번째 클릭이면 콜백 실행
          onTripleClick();
          setTimestamps([]);
        } else {
          // 클릭 카운트 업데이트
          setTimestamps([...recentClicks, now]);
        }
      };
    },
    [gameState]
  );

  const handleTitleClick = useCallback(() => {
    const handler = createTripleClickHandler(titleClickTimestamps, setTitleClickTimestamps, () => {
      // 세 번째 클릭이면 점수를 60점으로 고정
      setScore(60);
    });
    handler();
  }, [titleClickTimestamps, createTripleClickHandler]);

  const handleTimeClick = useCallback(() => {
    const handler = createTripleClickHandler(timeClickTimestamps, setTimeClickTimestamps, () => {
      // 세 번째 클릭이면 시간을 5초로 설정
      setTimeLeft(5);
    });
    handler();
  }, [timeClickTimestamps, createTripleClickHandler]);

  // 프로모션 코드 복사 핸들러 (슈퍼 코드 지원 추가)
  const handleCopyPromoCode = useCallback(async (isSuper: boolean = false) => {
    try {
      await navigator.clipboard.writeText(isSuper ? SUPER_PROMO_CODE : PROMO_CODE);
      setPromoCodeCopied(true);
      setTimeout(() => setPromoCodeCopied(false), 2000);
    } catch {
      // 클립보드 복사 실패 시 무시
    }
  }, []);

  // 현재 표시할 프로모션 타입 결정
  const currentPromoType = hasUnlockedSuperPromo ? "super" : hasUnlockedPromo ? "normal" : null;

  return (
    <div className="absolute inset-0 bg-black/80 flex items-center justify-center animate-fade-in p-4 overflow-y-auto">
      {/* 프로모션 배너 (버튼 클릭 시 표시) */}
      {currentPromoType && (
        <div
          className={cn(
            "fixed top-0 left-1/2 -translate-x-1/2 z-10000 transition-transform duration-300 ease-out",
            isPromoBannerVisible ? "translate-y-4" : "-translate-y-full"
          )}
        >
          <div
            ref={promoBannerRef}
            className={cn(
              "relative text-white px-6 py-4 rounded-xl shadow-2xl backdrop-blur-sm border border-white/20 min-w-[320px] max-w-[90vw] flex flex-col sm:flex-row items-center gap-4",
              currentPromoType === "super"
                ? "bg-linear-to-r from-purple-600 via-pink-600 to-purple-600"
                : "bg-linear-to-r from-emerald-500 via-emerald-600 to-emerald-500"
            )}
          >
            <div className="flex-1 text-center sm:text-left">
              <div className="text-lg font-bold flex items-center justify-center sm:justify-start gap-2">
                <Image
                  src={currentPromoType === "super" ? "/icons/🎟️ entry_ticket.svg" : "/icons/🎫 ticket.svg"}
                  alt="ticket"
                  width={28}
                  height={28}
                  className="animate-bounce"
                />
                <span>{currentPromoType === "super" ? "Pro Plan 1개월 무료 이용권" : "Pro Plan $1 이용권"}</span>
              </div>
              <p className="text-sm text-white/90 mt-1">
                {currentPromoType === "super"
                  ? dictionary.superPromoToastDescription
                  : dictionary.promoToastDescription}
              </p>
              <p className="text-xs text-white/70 mt-1">{dictionary.promoUseGuide}</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center bg-white/20 rounded-lg px-3 py-2 border border-white/30">
                <span className="font-mono font-bold text-lg tracking-wider">
                  {currentPromoType === "super" ? SUPER_PROMO_CODE : PROMO_CODE}
                </span>
                <button
                  onClick={() => handleCopyPromoCode(currentPromoType === "super")}
                  className="ml-2 p-1 hover:bg-white/20 rounded transition-colors"
                  aria-label="Copy promo code"
                >
                  {promoCodeCopied ? <Check className="w-4 h-4 text-white" /> : <Copy className="w-4 h-4 text-white" />}
                </button>
              </div>
              <Link
                href="/pricing"
                className={cn(
                  "font-semibold shadow-lg hover:scale-105 transition-transform px-4 py-2 rounded-lg text-sm",
                  currentPromoType === "super"
                    ? "bg-white text-purple-600 hover:bg-white/90"
                    : "bg-white text-emerald-600 hover:bg-white/90"
                )}
              >
                {dictionary.goToPricing}
              </Link>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl rounded-xl shadow-xl flex flex-col my-auto max-h-[calc(100vh-2rem)] w-full">
        <div className="flex items-center justify-between px-4 sm:px-4 py-3">
          <div className="font-semibold text-lg sm:text-xl text-white select-none" onClick={handleTitleClick}>
            Alt는 시간제한없는 AI 강의 필기·요약앱입니다.
            <br />
            60점을 달성하고 Pro 쿠폰을 획득하세요
          </div>
          <div className="flex items-center gap-2">
            {currentPromoType && (
              <Button
                ref={promoBannerButtonRef}
                className={cn(
                  "text-white gap-2",
                  currentPromoType === "super"
                    ? "bg-purple-600 hover:bg-purple-700"
                    : "bg-emerald-600 hover:bg-emerald-700"
                )}
                onClick={() => setIsPromoBannerVisible(!isPromoBannerVisible)}
              >
                <Image
                  src={currentPromoType === "super" ? "/icons/🎟️ entry_ticket.svg" : "/icons/🎫 ticket.svg"}
                  alt="ticket"
                  width={20}
                  height={20}
                />
                <span className="hidden sm:inline">{currentPromoType === "super" ? "1개월 무료" : "$1 이용권"}</span>
              </Button>
            )}
            <Button className="text-white bg-white/15" onClick={handleClose}>
              홈 이동
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
                    className="text-sm font-bold whitespace-nowrap min-w-[3ch] select-none"
                    onClick={handleTimeClick}
                  >
                    {formatTime(timeLeft)}
                  </span>
                  <TimeProgressBar timeLeft={timeLeft} totalTime={GAME_SECONDS} />
                  <VolumeControl
                    volume={bgmVolume}
                    isMuted={isMuted}
                    onVolumeChange={(newVolume) => {
                      setBgmVolume(newVolume);
                      if (newVolume > 0 && isMuted) {
                        setIsMuted(false);
                      }
                    }}
                    onMuteToggle={() => setIsMuted(!isMuted)}
                    variant="light"
                  />
                </div>
              </div>
              <div className="flex items-center gap-2">
                {gameState === "running" && (
                  <Button
                    variant="default"
                    onClick={() => {
                      trackGameRetry("desktop");
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
                      trackGameRestart("desktop");
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
                    <p className="text-xl font-bold text-gray-900 text-center px-4 drop-shadow-sm whitespace-pre-wrap">
                      {dictionary.promoRequirement}
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
              userEmail={submittedData ? `${submittedData.nickname} (${submittedData.organization})` : undefined}
              userOrganization={submittedData?.organization}
              refreshTrigger={leaderboardRefreshTrigger}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
