"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Sixtyfour } from "next/font/google";
import { SquareTomatoGame, MobileSquareTomatoGame } from "@/components/game";
import type { Locale } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n/dictionary";
import { isMobileDevice } from "@/lib/device";

const sixtyfour = Sixtyfour({
  subsets: ["latin"],
  variable: "--font-sixtyfour",
});

type GamePageClientProps = {
  locale: Locale;
  dictionary: Dictionary["game"];
};

export function GamePageClient({ locale, dictionary }: GamePageClientProps) {
  const router = useRouter();
  const [isAnimating, setIsAnimating] = useState(false);
  const [showGame, setShowGame] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const animationStartPosRef = useRef<{ left: number; top: number; width: number; height: number } | null>(null);

  useEffect(() => {
    // 모바일 감지
    setIsMobile(isMobileDevice());

    // 페이지 진입 시 애니메이션 시작
    // 화면 중앙에서 시작
    animationStartPosRef.current = {
      left: typeof window !== "undefined" ? window.innerWidth / 2 - 100 : 0,
      top: typeof window !== "undefined" ? window.innerHeight / 2 - 25 : 0,
      width: 200,
      height: 50,
    };

    setIsAnimating(true);

    // 애니메이션 완료 후 게임 화면 표시
    const timer = setTimeout(() => {
      setShowGame(true);
    }, 2560);

    return () => clearTimeout(timer);
  }, []);

  return (
    <>
      {/* 풀스크린 애니메이션 오버레이 */}
      {(isAnimating || showGame) && animationStartPosRef.current && (
        <div className="fixed inset-0 z-9999">
          {/* 버튼에서 확장되는 배경 */}
          <div
            className="absolute bg-primary animate-expand-from-button"
            style={{
              left: animationStartPosRef.current.left,
              top: animationStartPosRef.current.top,
              width: animationStartPosRef.current.width,
              height: animationStartPosRef.current.height,
              borderRadius: "0.375rem",
            }}
          />

          {/* 텍스트 애니메이션 */}
          {!showGame && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="text-center">
                <div
                  className={`flex flex-col items-center gap-6 text-6xl font-bold text-primary-foreground tracking-tight scale-x-90 ${sixtyfour.className}`}
                >
                  <span className="animate-word-appear animation-delay-800">Get coupon</span>
                  <span className="animate-word-appear animation-delay-1200">if</span>
                  <span className="animate-word-appear animation-delay-1600">you</span>
                  <span className="animate-word-appear animation-delay-2000">can</span>
                </div>
              </div>
            </div>
          )}

          {/* 게임 화면 */}
          {showGame && (
            isMobile ? (
              <MobileSquareTomatoGame
                onClose={() => {
                  router.push(`/${locale}`);
                }}
                dictionary={dictionary}
              />
            ) : (
              <SquareTomatoGame
                onClose={() => {
                  router.push(`/${locale}`);
                }}
                dictionary={dictionary}
              />
            )
          )}
        </div>
      )}
    </>
  );
}
