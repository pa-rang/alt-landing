"use client";

import { useState, useRef } from "react";
import { ArrowDownToLine } from "lucide-react";
import type { Dictionary } from "@/lib/i18n/dictionary";
import type { Locale } from "@/lib/i18n/config";
import { Button } from "@/components/ui/button";
import { WaitlistDialog } from "@/components/waitlist-dialog";
import { SquareTomatoGame } from "@/components/game";

type WaitlistFormDictionary = Dictionary["waitlistForm"];
type WaitlistDialogTexts = Dictionary["waitlistDialog"];
type GameDictionary = Dictionary["game"];

type WaitlistFormProps = {
  locale: Locale;
  dictionary: WaitlistFormDictionary;
  dialogTexts: WaitlistDialogTexts;
  gameDictionary: GameDictionary;
};

export function WaitlistForm({ locale, dictionary, dialogTexts, gameDictionary }: WaitlistFormProps) {
  const [email] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [showGame, setShowGame] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const handleGameStart = () => {
    setIsAnimating(true);

    // 애니메이션 완료 후 게임 화면 표시
    setTimeout(() => {
      setShowGame(true);
    }, 2800);
  };

  return (
    <>
      <div className="w-full relative">
        <div className="flex flex-col xs:flex-row gap-2">
          <Button
            ref={buttonRef}
            onClick={handleGameStart}
            className="whitespace-nowrap relative overflow-visible text-base rounded-xl px-4! py-6!"
            size="lg"
            disabled={isAnimating}
          >
            {dictionary.submit.idle}
            <ArrowDownToLine className="ml-1 h-5 w-5" />
          </Button>
        </div>
        <p className="text-[13px] text-muted-foreground mt-2">{dictionary.earlyAccessNote}</p>
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
              <div className="text-center space-y-4">
                <div className="flex flex-col items-center gap-2">
                  <span className="text-7xl font-bold text-primary-foreground animate-word-appear animation-delay-800">
                    download
                  </span>
                  <span className="text-7xl font-bold text-primary-foreground animate-word-appear animation-delay-1200">
                    if
                  </span>
                  <span className="text-7xl font-bold text-primary-foreground animate-word-appear animation-delay-1600">
                    you
                  </span>
                  <span className="text-7xl font-bold text-primary-foreground animate-word-appear animation-delay-2000">
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

      <WaitlistDialog
        locale={locale}
        dictionary={dictionary}
        dialogTexts={dialogTexts}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        initialEmail={email}
      />
    </>
  );
}
