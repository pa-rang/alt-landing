"use client";

import Link from "next/link";
import { Globe } from "lucide-react";

import { SUPPORTED_LOCALES, type Locale } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n/dictionary";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

type LanguageSwitcherDictionary = Dictionary["languageSwitcher"];

type LanguageSwitcherProps = {
  locale: Locale;
  dictionary: LanguageSwitcherDictionary;
};

export function LanguageSwitcher({ locale, dictionary }: LanguageSwitcherProps) {
  const currentLanguage = dictionary.languages[locale];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Globe className="h-4 w-4" />
          <span className="sr-only sm:not-sr-only">{currentLanguage}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {SUPPORTED_LOCALES.map((item) => (
          <DropdownMenuItem key={item} asChild>
            <Link
              href={`/${item}`}
              className={`w-full ${
                item === locale ? "bg-accent" : ""
              }`}
            >
              {dictionary.languages[item]}
              {item === locale && (
                <span className="ml-auto text-xs text-muted-foreground">✓</span>
              )}
            </Link>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
