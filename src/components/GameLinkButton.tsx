"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import type { Locale } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n/dictionary";
import { Button } from "@/components/ui/button";

// GA4 이벤트 추적 함수
function trackGameStart(locale: string) {
  if (typeof window !== "undefined" && window.gtag) {
    window.gtag("event", "game_start_button_click", {
      event_category: "game",
      event_label: "header_game_start",
      page_locale: locale,
      timestamp: new Date().toISOString(),
    });
  }
}

// 게임 컨트롤러 아이콘
function GameControllerIcon() {
  return <Image src="/icons/🎮️ game_dark.svg" alt="Game" width={16} height={16} className="shrink-0" unoptimized />;
}

type GameLinkButtonProps = {
  locale: Locale;
  dictionary: Dictionary["game"];
  // 각 locale의 다운로드 게임 버튼 라벨
  labels: Record<Locale, string>;
};

export function GameLinkButton({ locale: initialLocale, dictionary, labels }: GameLinkButtonProps) {
  const pathname = usePathname();
  const [isSmallScreen, setIsSmallScreen] = useState(false);

  useEffect(() => {
    const checkScreenSize = () => {
      setIsSmallScreen(window.innerWidth <= 480);
    };

    checkScreenSize();
    window.addEventListener("resize", checkScreenSize);
    return () => window.removeEventListener("resize", checkScreenSize);
  }, []);

  // URL에서 현재 locale 추출
  const segments = pathname.split("/").filter(Boolean);
  const currentLocale = (segments[0] || initialLocale) as Locale;

  // 현재 locale에 맞는 라벨 표시
  let buttonLabel = labels?.[currentLocale] || dictionary.downloadGameButton;

  // 화면 너비가 480px 이하이면 "다운로드 게임"을 "게임"으로 변경
  if (isSmallScreen && buttonLabel === "다운로드 게임") {
    buttonLabel = "게임";
  }

  const handleClick = () => {
    trackGameStart(currentLocale);
  };

  return (
    <Button variant="outline" size="sm" className="gap-1 rounded-full shadow-none text-[13px]" asChild>
      <Link href={`/${currentLocale}/game`} onClick={handleClick}>
        <GameControllerIcon />
        <span>{buttonLabel}</span>
      </Link>
    </Button>
  );
}
