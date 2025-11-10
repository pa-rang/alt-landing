"use client";

import { type Locale } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n/dictionary";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { FeedbackButton } from "@/components/FeedbackButton";
import { JoinUsButton } from "@/components/JoinUsButton";
import { JoinCommunityButton } from "@/components/JoinCommunityButton";
import { HomeIcon } from "@/components/HomeIcon";
import { GameLinkButton } from "@/components/GameLinkButton";
import { ResponsiveButtonGroup } from "@/components/ResponsiveButtonGroup";

type HeaderProps = {
  locale: Locale;
  dictionary: Dictionary;
  gameButtonLabels: Record<Locale, string>;
  feedbackLabels: Record<Locale, string>;
};

export function Header({ locale, dictionary, gameButtonLabels, feedbackLabels }: HeaderProps) {
  return (
    <header className="w-full bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto max-w-7xl">
        <div className="flex h-14 w-full items-center justify-between px-4 md:px-8">
          <div className="flex items-center space-x-4">
            <HomeIcon locale={locale} />
          </div>
          <div className="flex items-center space-x-2 flex-1 justify-end min-w-0">
            <ResponsiveButtonGroup>
              <GameLinkButton locale={locale} dictionary={dictionary.game} labels={gameButtonLabels} />
              <JoinCommunityButton locale={locale} />
              <FeedbackButton locale={locale} dictionary={dictionary.feedback} labels={feedbackLabels} />
              <JoinUsButton locale={locale} />
            </ResponsiveButtonGroup>
            <LanguageSwitcher locale={locale} dictionary={dictionary.languageSwitcher} />
          </div>
        </div>
      </div>
    </header>
  );
}
