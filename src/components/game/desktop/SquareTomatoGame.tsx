"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { GAME_SECONDS, PROMO_THRESHOLD_SCORE, formatTime } from "@/lib/apple-game";
import type { Dictionary } from "@/lib/i18n/dictionary";
import type { Locale } from "@/lib/i18n/config";
import { LeaderboardBox } from "../LeaderboardBox";
import { VolumeControl } from "../VolumeControl";
import { trackGameStart, trackGameRetry, trackGameRestart } from "../shared/tracking";
import { ScoreDisplay } from "./ScoreDisplay";
import { TimeProgressBar } from "../shared/TimeProgressBar";
import { GameStartOverlay } from "./GameStartOverlay";

// 커스텀 훅
import { useGameState, useGameAudio, useAuth, usePromotion, useDragSelection } from "./hooks";

// 분리된 컴포넌트
import { PromoBanner, GameHeader, GameBoard, GameOverModal } from "./components";

type SquareTomatoGameProps = {
  onClose: () => void;
  dictionary: Dictionary["game"];
  locale: Locale;
  fullDictionary: Dictionary;
};

export function SquareTomatoGame({ onClose, dictionary, locale, fullDictionary }: SquareTomatoGameProps) {
  const boardRef = useRef<HTMLDivElement | null>(null);

  // 커스텀 훅 사용
  const {
    cells,
    score,
    timeLeft,
    gameState,
    showScoreSubmit,
    submittedData,
    bestScore,
    bestRank,
    organizationRank,
    organizationName,
    leaderboardRefreshTrigger,
    setTimeLeft,
    setShowScoreSubmit,
    setGameState,
    resetGame,
    startGame,
    removeCells,
    handleScoreSubmitSuccess,
  } = useGameState();

  const { bgmVolume, isMuted, playClearSound, stopBgm, handleVolumeChange, toggleMute } = useGameAudio(gameState);
  const { isAuthenticated, userEmail, subscriptionStatus } = useAuth();
  const {
    isPromoBannerVisible,
    promoCodeCopied,
    promoBannerRef,
    promoBannerButtonRef,
    currentPromoType,
    handleCopyPromoCode,
    togglePromoBanner,
    triggerConfetti,
  } = usePromotion(gameState, score);

  // 드래그 클리어 핸들러
  const handleClear = useCallback(
    (indices: number[]) => {
      removeCells(indices);
      playClearSound();
    },
    [removeCells, playClearSound]
  );

  const {
    isDragging,
    selectedIndices,
    selectionRect,
    sumIsTen,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    clearSelection,
  } = useDragSelection(gameState, cells, boardRef, handleClear);

  // 트리플 클릭 관련 상태 (치트 기능)
  const [titleClickTimestamps, setTitleClickTimestamps] = useState<number[]>([]);
  const [timeClickTimestamps, setTimeClickTimestamps] = useState<number[]>([]);

  // PROMO_THRESHOLD_SCORE 이상일 때 confetti 발사
  useEffect(() => {
    if (showScoreSubmit && score >= PROMO_THRESHOLD_SCORE) {
      const timer = setTimeout(() => {
        triggerConfetti();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [showScoreSubmit, score, triggerConfetti]);

  // 게임 닫기 핸들러 (BGM 중지 후 닫기)
  const handleClose = useCallback(() => {
    stopBgm();
    onClose();
  }, [stopBgm, onClose]);

  // 리셋 시 추가 상태 초기화
  const handleReset = useCallback(() => {
    resetGame();
    clearSelection();
    setTitleClickTimestamps([]);
    setTimeClickTimestamps([]);
  }, [resetGame, clearSelection]);

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
      // useGameState의 setScore에 직접 접근이 불가하므로 외부에서 관리
      // 이 치트 기능을 위해 gameState 훅에서 setScore 노출 필요
    });
    handler();
  }, [titleClickTimestamps, createTripleClickHandler]);

  const handleTimeClick = useCallback(() => {
    const handler = createTripleClickHandler(timeClickTimestamps, setTimeClickTimestamps, () => {
      setTimeLeft(5);
    });
    handler();
  }, [timeClickTimestamps, createTripleClickHandler, setTimeLeft]);

  const handleStart = useCallback(() => {
    trackGameStart("desktop");
    startGame();
    setGameState("running");
  }, [startGame, setGameState]);

  return (
    <div className="absolute inset-0 bg-black/80 flex items-center justify-center animate-fade-in p-4 overflow-y-auto">
      {/* 프로모션 배너 */}
      <PromoBanner
        isVisible={isPromoBannerVisible}
        promoType={currentPromoType}
        promoCodeCopied={promoCodeCopied}
        promoBannerRef={promoBannerRef}
        dictionary={dictionary}
        onCopyPromoCode={handleCopyPromoCode}
      />

      {/* 상단 헤더 */}
      <GameHeader
        locale={locale}
        dictionary={dictionary}
        fullDictionary={fullDictionary}
        leaderboardRefreshTrigger={leaderboardRefreshTrigger}
        currentPromoType={currentPromoType}
        isAuthenticated={isAuthenticated}
        userEmail={userEmail}
        subscriptionStatus={subscriptionStatus}
        promoBannerButtonRef={promoBannerButtonRef}
        onClose={handleClose}
        onTogglePromoBanner={togglePromoBanner}
      />

      <div className="max-w-7xl rounded-xl shadow-xl flex flex-col my-auto max-h-[calc(100vh-2rem)] w-full">
        <div className="flex flex-col lg:flex-row items-center justify-start px-4 sm:px-4 py-3 gap-4 lg:gap-0">
          <div
            className="font-semibold text-lg sm:text-xl text-white select-none text-center lg:text-left"
            onClick={handleTitleClick}
          >
            {dictionary.gameTitle}
            <br />
            {dictionary.gameSubtitle}
          </div>
        </div>

        {/* 게임 박스와 리더보드 박스 */}
        <div className="flex flex-col lg:flex-row gap-4 p-4 overflow-auto flex-1">
          {/* 게임 박스 */}
          <div className="flex-none lg:flex-1 bg-white rounded-lg border shadow-sm flex flex-col">
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
                    onVolumeChange={handleVolumeChange}
                    onMuteToggle={toggleMute}
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
                      handleReset();
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
                      handleReset();
                    }}
                  >
                    {dictionary.restart}
                  </Button>
                )}
              </div>
            </div>

            <div className="px-4 pb-5 overflow-auto flex-1">
              <GameBoard
                cells={cells}
                selectedIndices={selectedIndices}
                selectionRect={selectionRect}
                sumIsTen={sumIsTen}
                isDragging={isDragging}
                boardRef={boardRef}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
              >
                {/* 시작 버튼 오버레이 */}
                {gameState === "idle" && (
                  <GameStartOverlay
                    bestScore={bestScore}
                    bestRank={bestRank}
                    organizationRank={organizationRank}
                    organizationName={organizationName}
                    dictionary={dictionary}
                    onStart={handleStart}
                  />
                )}
              </GameBoard>

              {/* 가이드 텍스트 */}
              <div className="mt-3 text-xs sm:text-sm text-gray-600">{dictionary.guide}</div>
            </div>

            {/* 점수 제출 모달 */}
            {gameState === "ended" && showScoreSubmit && (
              <GameOverModal
                score={score}
                bestScore={bestScore}
                dictionary={dictionary}
                onClose={() => setShowScoreSubmit(false)}
                onSubmitSuccess={handleScoreSubmitSuccess}
              />
            )}
          </div>

          {/* 리더보드 박스 */}
          <div className="flex-none h-[500px] lg:h-auto lg:flex-1">
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
