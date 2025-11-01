"use client";

import { useState, useRef } from "react";
import { ArrowDownToLine } from "lucide-react";
import type { Locale } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n/dictionary";
import { Button } from "@/components/ui/button";
import { SquareTomatoGame } from "@/components/game";

// GA4 이벤트 추적 함수
function trackGameStart(locale: string) {
  if (typeof window !== "undefined" && window.gtag) {
    window.gtag("event", "game_start_button_click", {
      event_category: "game",
      event_label: "waitlist_game_start",
      page_locale: locale,
      timestamp: new Date().toISOString(),
    });
  }
}

type GameLauncherProps = {
  locale: Locale;
  gameDictionary: Dictionary["game"];
  buttonLabel: string;
  earlyAccessNote: string;
};

export function GameLauncher({ locale, gameDictionary, buttonLabel, earlyAccessNote }: GameLauncherProps) {
  const [isAnimating, setIsAnimating] = useState(false);
  const [showGame, setShowGame] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const handleGameStart = () => {
    trackGameStart(locale);
    setIsAnimating(true);

    // 애니메이션 완료 후 게임 화면 표시
    setTimeout(() => {
      setShowGame(true);
    }, 2560);
  };

  return (
    <>
      <div className="w-full relative">
        <div className="flex flex-col xs:flex-row gap-2">
          <Button
            ref={buttonRef}
            onClick={handleGameStart}
            className="whitespace-nowrap relative overflow-visible text-[#f2f1ed] font-mono font-semibold text-base bg-gradient-to-b from-zinc-800 to-zinc-900 border-2 border-zinc-700 rounded-lg px-6 py-5 shadow-[0_3px_0_0_#27272a,0_4px_6px_rgba(0,0,0,0.3)] hover:shadow-[inset_0_2px_3px_rgba(0,0,0,0.4)] active:shadow-[inset_0_2px_3px_rgba(0,0,0,0.4)] transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-[0_3px_0_0_#27272a,0_4px_6px_rgba(0,0,0,0.3)]"
            disabled={isAnimating}
          >
            {buttonLabel}
            <ArrowDownToLine className="ml-2 h-5 w-5" />
          </Button>
        </div>
        <p className="text-[13px] text-muted-foreground mt-2">{earlyAccessNote}</p>
      </div>

      {/* 풀스크린 애니메이션 오버레이 */}
      {(isAnimating || showGame) && (
        <div className="fixed inset-0 z-9999">
          {/* 버튼에서 확장되는 배경 */}
          <div
            className="absolute bg-primary animate-expand-from-button"
            style={{
              left: buttonRef.current?.getBoundingClientRect().left ?? 0,
              top: buttonRef.current?.getBoundingClientRect().top ?? 0,
              width: buttonRef.current?.offsetWidth ?? 0,
              height: buttonRef.current?.offsetHeight ?? 0,
              borderRadius: "0.375rem",
            }}
          />

          {/* 텍스트 애니메이션 */}
          {!showGame && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="text-center">
                <div className="flex flex-col items-center gap-3">
                  <span className="text-7xl font-bold text-primary-foreground animate-word-appear animation-delay-800 tracking-tight">
                    download
                  </span>
                  <span className="text-7xl font-bold text-primary-foreground animate-word-appear animation-delay-1200 tracking-tight">
                    if
                  </span>
                  <span className="text-7xl font-bold text-primary-foreground animate-word-appear animation-delay-1600 tracking-tight">
                    you
                  </span>
                  <span className="text-7xl font-bold text-primary-foreground animate-word-appear animation-delay-2000 tracking-tight">
                    can
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* 게임 화면 */}
          {showGame && (
            <SquareTomatoGame
              onClose={() => {
                setShowGame(false);
                setIsAnimating(false);
              }}
              dictionary={gameDictionary}
            />
          )}
        </div>
      )}
    </>
  );
}
