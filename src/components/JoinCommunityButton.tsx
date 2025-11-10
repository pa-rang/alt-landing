"use client";

import Image from "next/image";
import { type Locale } from "@/lib/i18n/config";
import { Button } from "@/components/ui/button";

// Element 아이콘
function ElementIcon() {
  return (
    <Image
      src="/icons/element.svg"
      alt="Element"
      width={16}
      height={16}
      className="shrink-0 rounded-full"
      unoptimized
    />
  );
}

type JoinCommunityButtonProps = {
  locale: Locale;
};

export function JoinCommunityButton({ locale: initialLocale }: JoinCommunityButtonProps) {
  const handleClick = () => {
    if (typeof window !== "undefined" && window.gtag) {
      window.gtag("event", "join_community_button_click", {
        event_category: "engagement",
        event_label: "join_community_button",
        page_locale: initialLocale,
        timestamp: new Date().toISOString(),
      });
    }
  };

  return (
    <Button variant="outline" size="sm" className="gap-1 rounded-full shadow-none text-[13px]" asChild>
      <a href="https://matrix.to/#/#Alt:matrix.org" target="_blank" rel="noopener noreferrer" onClick={handleClick}>
        <ElementIcon />
        <span>Join our community</span>
      </a>
    </Button>
  );
}
