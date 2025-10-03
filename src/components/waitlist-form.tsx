"use client";

import { useState, type FormEvent } from "react";
import { z } from "zod";
import type { Dictionary } from "@/lib/i18n/dictionary";
import type { Locale } from "@/lib/i18n/config";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { WaitlistDialog } from "@/components/waitlist-dialog";
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
    setDialogOpen(true);
  };

  return (
    <>
      <form onSubmit={handleSubmit} className="w-full">
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
          />
          <Button type="submit" className="whitespace-nowrap h-10" size="default">
            {dictionary.submit.idle}
          </Button>
        </div>
        {emailError ? <p className="text-sm text-destructive mt-2">{emailError}</p> : null}
        <p className="text-xs text-muted-foreground mt-2">{dictionary.earlyAccessNote}</p>
      </form>

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
