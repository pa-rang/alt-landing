"use client";

import Link from "next/link";
import { MessageSquare } from "lucide-react";

import type { Locale } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n/dictionary";
import { Button } from "@/components/ui/button";

type FeedbackButtonDictionary = Dictionary["feedback"];

type FeedbackButtonProps = {
  locale: Locale;
  dictionary: FeedbackButtonDictionary;
};

export function FeedbackButton({ locale, dictionary }: FeedbackButtonProps) {
  return (
    <Button variant="outline" size="sm" className="gap-2" asChild>
      <Link href={`/${locale}/feedback`}>
        <MessageSquare className="h-4 w-4" />
        <span className="sr-only sm:not-sr-only">{dictionary.button}</span>
      </Link>
    </Button>
  );
}
