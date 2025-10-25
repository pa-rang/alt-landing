"use client";

import { useState, type FormEvent, useRef } from "react";
import { z } from "zod";
import type { Dictionary } from "@/lib/i18n/dictionary";
import type { Locale } from "@/lib/i18n/config";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { WaitlistDialog } from "@/components/waitlist-dialog";
import { DownloadGame } from "@/components/download-game";
import { cn } from "@/lib/utils";

type WaitlistFormDictionary = Dictionary["waitlistForm"];
type WaitlistDialogTexts = Dictionary["waitlistDialog"];

type WaitlistFormProps = {
  locale: Locale;
  dictionary: WaitlistFormDictionary;
  dialogTexts: WaitlistDialogTexts;
};

export function WaitlistForm({ locale, dictionary, dialogTexts }: WaitlistFormProps) {
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [showGame, setShowGame] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    // 간단한 이메일 검증
    const emailResult = z
      .string()
      .trim()
      .min(1, dictionary.validation.emailRequired)
      .email(dictionary.validation.emailInvalid)
      .safeParse(email);

    if (!emailResult.success) {
      setEmailError(emailResult.error.issues[0]?.message || dictionary.validation.emailInvalid);
      return;
    }

    setEmailError("");
    setIsAnimating(true);

    // 애니메이션 완료 후 게임 화면 표시
    setTimeout(() => {
      setShowGame(true);
    }, 2800);
  };

  return (
    <>
      <form onSubmit={handleSubmit} className="w-full relative">
        <div className="flex flex-col xs:flex-row gap-2">
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(event) => {
              setEmail(event.target.value);
              if (emailError) setEmailError("");
            }}
            placeholder={dictionary.emailPlaceholder}
            className={cn("flex-1 h-10 bg-stone-200 border-none", emailError && "border-destructive")}
            disabled={isAnimating}
          />
          <Button
            ref={buttonRef}
            type="submit"
            className="whitespace-nowrap h-10 relative overflow-visible"
            size="default"
            disabled={isAnimating}
          >
            {dictionary.submit.idle}
          </Button>
        </div>
        {emailError ? <p className="text-sm text-destructive mt-2">{emailError}</p> : null}
        <p className="text-xs text-muted-foreground mt-2">{dictionary.earlyAccessNote}</p>
      </form>

      {/* 풀스크린 애니메이션 오버레이 */}
      {(isAnimating || showGame) && (
        <div className="fixed inset-0 z-[9999]">
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
            <DownloadGame
              onClose={() => {
                setShowGame(false);
                setIsAnimating(false);
              }}
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
