"use client";

import { useState, type ReactNode } from "react";
import { WaitlistDialog } from "./waitlist-dialog";
import type { Dictionary } from "@/lib/i18n/dictionary";
import type { Locale } from "@/lib/i18n/config";

// GA4 이벤트 추적 함수
function trackWaitlistButtonClick(locale: string) {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'waitlist_button_click', {
      event_category: 'conversion',
      event_label: 'waitlist_button',
      page_locale: locale,
      timestamp: new Date().toISOString()
    });
  }
}

type WaitlistButtonProps = {
  locale: Locale;
  dictionary: Dictionary["waitlistForm"];
  dialogTexts: Dictionary["waitlistDialog"];
  children: ReactNode;
};

export function WaitlistButton({ locale, dictionary, dialogTexts, children }: WaitlistButtonProps) {
  const [open, setOpen] = useState(false);

  const handleWaitlistClick = () => {
    trackWaitlistButtonClick(locale);
    setOpen(true);
  };

  return (
    <>
      <div onClick={handleWaitlistClick}>{children}</div>
      <WaitlistDialog
        locale={locale}
        dictionary={dictionary}
        dialogTexts={dialogTexts}
        open={open}
        onOpenChange={setOpen}
        initialEmail=""
      />
    </>
  );
}