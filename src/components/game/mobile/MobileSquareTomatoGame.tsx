"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Trophy, Volume2, VolumeX, Home, Ticket } from "lucide-react";
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
import { useOrientationLock } from "@/hooks/useOrientationLock";
import { trackGameStart, trackGameRetry, trackGameRestart } from "../shared/tracking";
import { BEST_SCORE_KEY, PROMO_UNLOCKED_KEY, SUPER_PROMO_UNLOCKED_KEY } from "../shared/constants";
import { TimeProgressBar } from "../shared/TimeProgressBar";
import { INFO_BAR_HEIGHT, PADDING } from "./constants";
import { ScoreSubmitModal } from "./ScoreSubmitModal";
import { PromoCodeModal } from "./PromoCodeModal";
import { LeaderboardOverlay } from "./LeaderboardOverlay";
import type { Cell } from "../shared/types";

type MobileSquareTomatoGameProps = {
  onClose: () => void;
  dictionary: Dictionary["game"];
};

export function MobileSquareTomatoGame({ onClose, dictionary }: MobileSquareTomatoGameProps) {
  const pathname = usePathname();
  const boardRef = useRef<HTMLDivElement | null>(null);
  const bgmRef = useRef<HTMLAudioElement | null>(null);
  const clearSfxRef = useRef<HTMLAudioElement | null>(null);

  // 모바일 전용: 리더보드 오버레이 표시 여부
  const [showLeaderboardOverlay, setShowLeaderboardOverlay] = useState<boolean>(false);

  // 모바일 전용: 그리드 크기 계산
  const [cellSize, setCellSize] = useState<number>(20);
  // 뷰포트 크기 상태 (초기값은 최소값으로 설정하여 깜빡임 방지)
  const [viewportSize, setViewportSize] = useState({ width: 0, height: 0 });

  // 화면 방향 고정 및 감지 (세로 모드로 잠금)
  const { deviceOrientation } = useOrientationLock({ lockTo: "portrait" });

  // 모바일에서 input focus 시 화면 확대 방지
  useEffect(() => {
    const viewportMeta = document.querySelector('meta[name="viewport"]');
    if (viewportMeta) {
      viewportMeta.setAttribute(
        "content",
        "width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no"
      );
    } else {
      const meta = document.createElement("meta");
      meta.name = "viewport";
      meta.content = "width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no";
      document.getElementsByTagName("head")[0].appendChild(meta);
    }

    return () => {
      // 컴포넌트 언마운트 시 원래대로 복원 (필요한 경우)
      const viewportMeta = document.querySelector('meta[name="viewport"]');
      if (viewportMeta) {
        viewportMeta.setAttribute("content", "width=device-width, initial-scale=1");
      }
    };
  }, []);

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
  const [promoCodeCopied, setPromoCodeCopied] = useState<boolean>(false);
  const [showPromoCodeModal, setShowPromoCodeModal] = useState<boolean>(false);

  // 치트키용 타임스탬프
  const [titleClickTimestamps, setTitleClickTimestamps] = useState<number[]>([]);
  const [timeClickTimestamps, setTimeClickTimestamps] = useState<number[]>([]);

  // BGM 볼륨 상태
  const [bgmVolume] = useState<number>(0.3);
  const [isMuted, setIsMuted] = useState<boolean>(false);

  // 모바일 뷰포트 크기 및 셀 크기 계산
  useEffect(() => {
    const updateViewportAndSize = () => {
      // visualViewport를 우선 사용하여 실제 보이는 영역 크기를 가져옴
      // iOS Safari 등에서 주소창이 보여지거나 숨겨질 때 window.innerHeight가 즉시 반영되지 않을 수 있음
      const width = window.visualViewport ? window.visualViewport.width : window.innerWidth;
      const height = window.visualViewport ? window.visualViewport.height : window.innerHeight;

      setViewportSize({ width, height });

      // 현재 기기 방향 감지
      let isCurrentlyPortrait = true;
      if (typeof window.orientation === "number") {
        isCurrentlyPortrait = Math.abs(window.orientation) !== 90;
      } else if (screen.orientation) {
        isCurrentlyPortrait = !screen.orientation.type.includes("landscape");
      } else {
        isCurrentlyPortrait = height > width;
      }

      // 가용 공간 계산 (세로 모드일 때는 회전 후 크기, 가로 모드일 때는 그대로)
      const containerWidth = isCurrentlyPortrait ? height : width;
      const containerHeight = isCurrentlyPortrait ? width : height;

      const fixedUIHeight = INFO_BAR_HEIGHT + 8 + PADDING * 2; // INFO_BAR_HEIGHT + 시간바 높이(8px) + 패딩
      const availableHeight = containerHeight - fixedUIHeight;
      const availableWidth = containerWidth - PADDING * 2;

      // 그리드 셀 크기 계산
      const sizeByWidth = availableWidth / COLS;
      const sizeByHeight = availableHeight / ROWS;

      const newCellSize = Math.floor(Math.min(sizeByWidth, sizeByHeight));
      setCellSize(Math.max(newCellSize, 16));
    };

    updateViewportAndSize();

    // visualViewport 이벤트 리스너 추가
    if (window.visualViewport) {
      window.visualViewport.addEventListener("resize", updateViewportAndSize);
      window.visualViewport.addEventListener("scroll", updateViewportAndSize);
    }
    window.addEventListener("resize", updateViewportAndSize);
    window.addEventListener("orientationchange", updateViewportAndSize);

    return () => {
      if (window.visualViewport) {
        window.visualViewport.removeEventListener("resize", updateViewportAndSize);
        window.visualViewport.removeEventListener("scroll", updateViewportAndSize);
      }
      window.removeEventListener("resize", updateViewportAndSize);
      window.removeEventListener("orientationchange", updateViewportAndSize);
    };
  }, [deviceOrientation]);

  // 게임 상태에 따라 BGM 재생/중지
  useEffect(() => {
    if (!bgmRef.current) return;

    if (gameState === "running") {
      // muted 상태여도 play는 호출되어야 함 (iOS 정책)
      bgmRef.current.play().catch(() => {
        // 자동 재생 차단 시 무시
      });
    } else {
      bgmRef.current.pause();
      bgmRef.current.currentTime = 0;
    }
  }, [gameState]);

  // 볼륨 및 음소거 상태 동기화 (초기화 및 외부 요인 대응)
  useEffect(() => {
    if (bgmRef.current) {
      bgmRef.current.muted = isMuted;
      bgmRef.current.volume = bgmVolume;
    }
    if (clearSfxRef.current) {
      clearSfxRef.current.muted = isMuted;
      clearSfxRef.current.volume = bgmVolume;
    }
  }, [bgmVolume, isMuted]);

  // 음소거 토글 핸들러 (사용자 제스처 내에서 직접 오디오 제어)
  const toggleMute = useCallback(() => {
    const newMutedState = !isMuted;
    setIsMuted(newMutedState);

    // 오디오 객체 직접 제어
    if (bgmRef.current) {
      bgmRef.current.muted = newMutedState;
      // 음소거 해제 시 재생 중이 아니면 재생 시도 (iOS 대응)
      if (!newMutedState && bgmRef.current.paused && gameState === "running") {
        bgmRef.current.play().catch(() => {});
      }
    }
    if (clearSfxRef.current) {
      clearSfxRef.current.muted = newMutedState;
    }
  }, [isMuted, gameState]);

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

  // 게임 종료 로직
  useEffect(() => {
    if (gameState === "ended") {
      if (score > bestScore) {
        setBestScore(score);
        localStorage.setItem(BEST_SCORE_KEY, String(score));
      }

      if (score >= SUPER_PROMO_THRESHOLD_SCORE && !hasUnlockedSuperPromo) {
        setHasUnlockedSuperPromo(true);
        localStorage.setItem(SUPER_PROMO_UNLOCKED_KEY, "true");
        if (!hasUnlockedPromo) {
          setHasUnlockedPromo(true);
          localStorage.setItem(PROMO_UNLOCKED_KEY, "true");
        }
      } else if (score >= PROMO_THRESHOLD_SCORE && !hasUnlockedPromo) {
        setHasUnlockedPromo(true);
        localStorage.setItem(PROMO_UNLOCKED_KEY, "true");
      }
    }
  }, [gameState, score, bestScore, hasUnlockedPromo, hasUnlockedSuperPromo]);

  // Confetti
  useEffect(() => {
    if (showScoreSubmit && score >= PROMO_THRESHOLD_SCORE) {
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

      const x = e.nativeEvent.offsetX;
      const y = e.nativeEvent.offsetY;

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
      const width = boardRef.current.offsetWidth;
      const height = boardRef.current.offsetHeight;

      const removedMask = cells.map((c) => c.removed);
      return computeSelectedIndicesFromRect(width, height, x1, y1, x2, y2, ROWS, COLS, removedMask);
    },
    [cells]
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!isDragging || !boardRef.current || !startPos) return;

      const x = e.nativeEvent.offsetX;
      const y = e.nativeEvent.offsetY;

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
      trackGameStart("mobile");
      resetGame();
      setGameState("running");
    }
  }, [gameState, resetGame]);

  const handleScoreSubmitSuccess = useCallback((data: { nickname: string; organization: string; rank: number }) => {
    setSubmittedData({ nickname: data.nickname, organization: data.organization, rank: data.rank });
    setShowScoreSubmit(false);
    setLeaderboardRefreshTrigger((prev) => prev + 1);
  }, []);

  const handleClose = useCallback(() => {
    if (bgmRef.current) {
      bgmRef.current.pause();
    }
    onClose();
  }, [onClose]);

  // 치트키
  const createTripleClickHandler = useCallback(
    (
      timestamps: number[],
      setTimestamps: React.Dispatch<React.SetStateAction<number[]>>,
      onTripleClick: () => void
    ) => {
      return () => {
        if (gameState !== "running") return;
        const now = Date.now();
        const recentClicks = timestamps.filter((ts) => now - ts < 2000);
        if (recentClicks.length >= 2) {
          onTripleClick();
          setTimestamps([]);
        } else {
          setTimestamps([...recentClicks, now]);
        }
      };
    },
    [gameState]
  );

  const handleTitleClick = useCallback(() => {
    const handler = createTripleClickHandler(titleClickTimestamps, setTitleClickTimestamps, () => {
      setScore(60);
    });
    handler();
  }, [titleClickTimestamps, createTripleClickHandler]);

  const handleTimeClick = useCallback(() => {
    const handler = createTripleClickHandler(timeClickTimestamps, setTimeClickTimestamps, () => {
      setTimeLeft(5);
    });
    handler();
  }, [timeClickTimestamps, createTripleClickHandler]);

  const handleCopyPromoCode = useCallback(async (isSuper: boolean = false) => {
    try {
      await navigator.clipboard.writeText(isSuper ? SUPER_PROMO_CODE : PROMO_CODE);
      setPromoCodeCopied(true);
      setTimeout(() => setPromoCodeCopied(false), 2000);
    } catch {}
  }, []);

  // 그리드 실제 크기 계산
  const gridWidth = cellSize * COLS;
  const gridHeight = cellSize * ROWS;

  // 뷰포트 크기가 없으면 렌더링하지 않음 (초기 로딩 시 깜빡임 방지)
  if (viewportSize.width === 0 || viewportSize.height === 0) {
    return null;
  }

  // 기기 방향에 따른 컨테이너 스타일 계산
  const isPortrait = deviceOrientation === "portrait";
  const containerStyle = isPortrait
    ? {
        // 세로 모드: 90도 회전하여 가로로 표시
        position: "absolute" as const,
        width: viewportSize.height,
        height: viewportSize.width,
        transform: "rotate(90deg)",
        transformOrigin: "top left",
        top: 0,
        left: viewportSize.width,
        overflow: "hidden",
        display: "flex",
        flexDirection: "column" as const,
        backgroundColor: "white",
      }
    : {
        // 가로 모드: 회전 없이 그대로 표시
        position: "absolute" as const,
        width: viewportSize.width,
        height: viewportSize.height,
        transform: "none",
        top: 0,
        left: 0,
        overflow: "hidden",
        display: "flex",
        flexDirection: "column" as const,
        backgroundColor: "white",
      };

  return (
    <div
      className="fixed inset-0 bg-black z-50"
      style={{
        overflow: "hidden",
        touchAction: "none",
        // 모바일 브라우저의 실제 뷰포트 크기에 맞춰 고정
        width: viewportSize.width,
        height: viewportSize.height,
        position: "fixed",
        top: 0,
        left: 0,
      }}
    >
      {/* 기기 방향에 따라 조건부 회전되는 컨테이너 */}
      <div style={containerStyle}>
        {/* 컨텐츠 영역 - 나머지 공간 전부 사용 */}
        <div
          className="flex-1 overflow-hidden"
          style={{ minHeight: 0 }} // flex item이 shrink할 수 있도록
        >
          {/* 게임 화면 */}
          {
            <div className="h-full flex flex-col" style={{ padding: PADDING }}>
              {/* 상단 정보 바 - 고정 높이 */}
              <div className="flex flex-col shrink-0 gap-1">
                <div className="flex items-center justify-between" style={{ height: INFO_BAR_HEIGHT }}>
                  <div className="flex items-center gap-1.5">
                    <Link
                      href={`/${pathname.split("/").filter(Boolean)[0] || "ko"}`}
                      className="px-1.5 py-0.5 rounded-md bg-gray-100 hover:bg-gray-200 transition-colors flex items-center justify-center"
                      aria-label="Home"
                    >
                      <Home className="w-3.5 h-3.5 text-gray-700" />
                    </Link>
                    <div className="px-1.5 py-0.5 rounded-md bg-gray-100 flex items-center gap-1">
                      <span className="text-[9px] text-gray-500 font-medium">SCORE</span>
                      <span className="text-xs font-bold text-gray-900">
                        {gameState === "idle" ? bestScore : score}
                      </span>
                    </div>
                    <div
                      className="px-1.5 py-0.5 rounded-md bg-gray-100 flex items-center gap-1"
                      onClick={handleTimeClick}
                    >
                      <span className="text-[9px] text-gray-500 font-medium">TIME</span>
                      <span
                        className={cn(
                          "text-xs font-bold whitespace-nowrap",
                          timeLeft <= 10 ? "text-red-500 animate-pulse" : "text-gray-900"
                        )}
                      >
                        {formatTime(timeLeft)}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 flex-1 justify-end" onClick={handleTimeClick}>
                      <div className="max-w-[200px] w-full">
                        <TimeProgressBar timeLeft={timeLeft} totalTime={GAME_SECONDS} />
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={toggleMute}
                      className="p-1 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
                      aria-label={isMuted ? "음소거 해제" : "음소거"}
                    >
                      {isMuted ? (
                        <VolumeX className="w-3.5 h-3.5 text-gray-500" />
                      ) : (
                        <Volume2 className="w-3.5 h-3.5 text-gray-700" />
                      )}
                    </button>
                    {(hasUnlockedPromo || hasUnlockedSuperPromo) && (
                      <button
                        onClick={() => setShowPromoCodeModal(true)}
                        className="p-1 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
                        aria-label="할인코드 보기"
                      >
                        <Ticket className="w-3.5 h-3.5 text-gray-700" />
                      </button>
                    )}
                    {gameState === "running" && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-6 text-[10px] px-1.5"
                        onClick={() => {
                          trackGameRetry("mobile");
                          resetGame();
                        }}
                      >
                        {dictionary.retry}
                      </Button>
                    )}
                    {gameState === "ended" && (
                      <Button
                        size="sm"
                        variant="default"
                        className="h-6 text-[10px] px-1.5"
                        onClick={() => {
                          trackGameRestart("mobile");
                          resetGame();
                        }}
                      >
                        {dictionary.restart}
                      </Button>
                    )}
                  </div>
                </div>
              </div>

              {/* 그리드 영역 - 남은 공간 전부 사용, 중앙 정렬 */}
              <div
                className="flex-1 flex items-center justify-center bg-green-50 rounded-lg border border-green-100 overflow-hidden"
                style={{ minHeight: 0, marginTop: PADDING }}
              >
                <div
                  ref={boardRef}
                  className="relative select-none"
                  style={{
                    display: "grid",
                    gridTemplateColumns: `repeat(${COLS}, ${cellSize}px)`,
                    gridTemplateRows: `repeat(${ROWS}, ${cellSize}px)`,
                    width: gridWidth,
                    height: gridHeight,
                    touchAction: "none",
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
                        "relative flex items-center justify-center border-[0.5px] border-emerald-200/50 pointer-events-none",
                        cell.removed ? "bg-transparent" : "bg-white"
                      )}
                      style={{ width: cellSize, height: cellSize }}
                    >
                      {!cell.removed ? (
                        <div
                          className={cn(
                            "flex items-center justify-center font-semibold transition-transform will-change-transform relative overflow-hidden rounded-sm",
                            sumIsTen && isDragging && selectedIndices.includes(cell.id) ? "scale-105" : ""
                          )}
                          style={{
                            width: cellSize - 2,
                            height: cellSize - 2,
                            fontSize: `${Math.max(cellSize * 0.4, 10)}px`,
                          }}
                        >
                          <Image
                            src="/apple_game_items/gemini_tomato_removebg.png"
                            alt="tomato"
                            fill
                            className="object-contain select-none"
                            unoptimized
                            draggable={false}
                          />
                          <span className="relative z-10 text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]">
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
                        "absolute border-2 pointer-events-none z-20",
                        sumIsTen ? "border-emerald-500 bg-emerald-500/20" : "border-yellow-500 bg-yellow-500/20"
                      )}
                      style={{
                        left: selectionRect.left,
                        top: selectionRect.top,
                        width: selectionRect.width,
                        height: selectionRect.height,
                      }}
                    />
                  ) : null}

                  {/* 시작 오버레이 */}
                  {gameState === "idle" && (
                    <div className="absolute inset-0 bg-white/85 backdrop-blur-sm z-30 flex flex-col items-center justify-center p-4 text-center">
                      <p className="text-sm font-bold text-gray-800 mb-4 whitespace-pre-wrap leading-relaxed">
                        {dictionary.promoRequirement}
                      </p>
                      <Button
                        size="lg"
                        className="text-base py-4 px-8 shadow-lg animate-pulse pointer-events-auto"
                        onClick={handleStart}
                      >
                        {dictionary.start}
                      </Button>
                      <Button
                        size="lg"
                        variant="outline"
                        className="text-base py-4 px-8 shadow-lg mt-3 pointer-events-auto flex items-center gap-2"
                        onClick={() => setShowLeaderboardOverlay(true)}
                      >
                        <Trophy className="w-5 h-5" />
                        {dictionary.leaderboardTitle}
                      </Button>
                      <p className="mt-4 text-xs text-gray-600 font-medium">{dictionary.guide}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          }
        </div>

        {/* 점수 제출 모달 */}
        {gameState === "ended" && showScoreSubmit && (
          <ScoreSubmitModal
            score={score}
            bestScore={bestScore}
            dictionary={dictionary}
            promoCodeCopied={promoCodeCopied}
            onCopyPromoCode={handleCopyPromoCode}
            onClose={() => setShowScoreSubmit(false)}
            onSuccess={handleScoreSubmitSuccess}
          />
        )}

        {/* 할인코드 보기 모달 */}
        {showPromoCodeModal && (
          <PromoCodeModal
            dictionary={dictionary}
            hasUnlockedPromo={hasUnlockedPromo}
            hasUnlockedSuperPromo={hasUnlockedSuperPromo}
            promoCodeCopied={promoCodeCopied}
            onCopyPromoCode={handleCopyPromoCode}
            onClose={() => setShowPromoCodeModal(false)}
          />
        )}

        {/* 리더보드 오버레이 */}
        {showLeaderboardOverlay && (
          <LeaderboardOverlay
            dictionary={dictionary}
            submittedData={submittedData}
            refreshTrigger={leaderboardRefreshTrigger}
            onClose={() => setShowLeaderboardOverlay(false)}
          />
        )}
      </div>
    </div>
  );
}
