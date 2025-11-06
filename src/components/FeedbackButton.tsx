"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { type Locale } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n/dictionary";
import { Button } from "@/components/ui/button";

// GA4 이벤트 추적 함수
function trackFeedbackClick(locale: string) {
  if (typeof window !== "undefined" && window.gtag) {
    window.gtag("event", "feedback_button_click", {
      event_category: "engagement",
      event_label: "feedback_button",
      page_locale: locale,
      timestamp: new Date().toISOString(),
    });
  }
}

type FeedbackButtonDictionary = Dictionary["feedback"];

type FeedbackButtonProps = {
  locale: Locale;
  dictionary: FeedbackButtonDictionary;
  // 각 locale의 피드백 버튼 라벨
  labels: Record<Locale, string>;
};

export function FeedbackButton({ locale: initialLocale, dictionary, labels }: FeedbackButtonProps) {
  const pathname = usePathname();

  // 피드백 페이지에서는 버튼을 표시하지 않음
  if (pathname.includes("/feedback")) {
    return null;
  }

  // URL에서 현재 locale 추출
  const segments = pathname.split("/").filter(Boolean);
  const currentLocale = (segments[0] || initialLocale) as Locale;

  // 현재 locale에 맞는 라벨 표시
  const buttonLabel = labels?.[currentLocale] || dictionary.button;

  const handleFeedbackClick = () => {
    trackFeedbackClick(currentLocale);
  };

  return (
    <Button variant="outline" size="sm" className="gap-2 rounded-full shadow-none text-[13px]" asChild>
      <Link href={`/${currentLocale}/feedback`} onClick={handleFeedbackClick}>
        <span>{buttonLabel}</span>
      </Link>
    </Button>
  );
}
