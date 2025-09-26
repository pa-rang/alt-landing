"use client";

import { useState, type FormEvent } from "react";
import { z } from "zod";

import type { Dictionary } from "@/lib/i18n/dictionary";
import type { Locale } from "@/lib/i18n/config";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { WaitlistDialog } from "@/components/waitlist-dialog";
import { cn } from "@/lib/utils";

type WaitlistFormDictionary = Dictionary["waitlistForm"];

type WaitlistFormProps = {
  locale: Locale;
  dictionary: WaitlistFormDictionary;
};

export function WaitlistForm({ locale, dictionary }: WaitlistFormProps) {
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    // 간단한 이메일 검증
    const emailResult = z.string().trim().min(1, dictionary.validation.emailRequired).email(dictionary.validation.emailInvalid).safeParse(email);

    if (!emailResult.success) {
      setEmailError(emailResult.error.issues[0]?.message || dictionary.validation.emailInvalid);
      return;
    }

    setEmailError("");
    setDialogOpen(true);
  };

  const handleEnterKeyPress = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();
      const form = event.currentTarget.closest('form');
      if (form) {
        const submitEvent = new Event('submit', { bubbles: true, cancelable: true });
        form.dispatchEvent(submitEvent);
      }
    }
  };

  return (
    <>
      <form onSubmit={handleSubmit} className="w-full max-w-md space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">
            {dictionary.emailLabel}
          </Label>
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
            onKeyPress={handleEnterKeyPress}
            placeholder={dictionary.emailPlaceholder}
            className={cn(emailError && "border-destructive")}
          />
          {emailError ? <p className="text-sm text-destructive">{emailError}</p> : null}
        </div>

        <Button
          type="submit"
          className="w-full"
        >
          {dictionary.submit.idle}
        </Button>
      </form>

      <WaitlistDialog
        locale={locale}
        dictionary={dictionary}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        initialEmail={email}
      />
    </>
  );
}
