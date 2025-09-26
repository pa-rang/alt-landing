"use client";

import { useState, type ReactNode } from "react";
import { WaitlistDialog } from "./waitlist-dialog";
import type { Dictionary } from "@/lib/i18n/dictionary";
import type { Locale } from "@/lib/i18n/config";

type WaitlistButtonProps = {
  locale: Locale;
  dictionary: Dictionary["waitlistForm"];
  children: ReactNode;
};

export function WaitlistButton({ locale, dictionary, children }: WaitlistButtonProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <div onClick={() => setOpen(true)}>{children}</div>
      <WaitlistDialog
        locale={locale}
        dictionary={dictionary}
        open={open}
        onOpenChange={setOpen}
        initialEmail=""
      />
    </>
  );
}