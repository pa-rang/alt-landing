"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Locale } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n/dictionary";

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

type GameLinkButtonProps = {
  locale: Locale;
  dictionary: Dictionary["game"];
  // 각 locale의 다운로드 게임 버튼 라벨
  labels: Record<Locale, string>;
};

export function GameLinkButton({ locale: initialLocale, dictionary, labels }: GameLinkButtonProps) {
  const pathname = usePathname();

  // URL에서 현재 locale 추출
  const segments = pathname.split("/").filter(Boolean);
  const currentLocale = (segments[0] || initialLocale) as Locale;

  // 현재 locale에 맞는 라벨 표시
  const buttonLabel = labels?.[currentLocale] || dictionary.downloadGameButton;

  const handleClick = () => {
    trackGameStart(currentLocale);
  };

  return (
    <Link
      href={`/${currentLocale}/game`}
      onClick={handleClick}
      className="text-sm text-muted-foreground hover:text-foreground transition-colors"
    >
      {buttonLabel}
    </Link>
  );
}
