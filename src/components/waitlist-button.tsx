"use client";

import { useState, type ReactNode } from "react";
import { WaitlistDialog } from "./waitlist-dialog";
import type { Dictionary } from "@/lib/i18n/dictionary";
import type { Locale } from "@/lib/i18n/config";

type WaitlistButtonProps = {
  locale: Locale;
  dictionary: Dictionary["waitlistForm"];
  dialogTexts: Dictionary["waitlistDialog"];
  children: ReactNode;
};

export function WaitlistButton({ locale, dictionary, dialogTexts, children }: WaitlistButtonProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <div onClick={() => setOpen(true)}>{children}</div>
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