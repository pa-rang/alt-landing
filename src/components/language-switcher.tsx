"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
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

export function LanguageSwitcher({ locale: initialLocale, dictionary }: LanguageSwitcherProps) {
  const pathname = usePathname();

  // URL에서 현재 locale 추출
  const segments = pathname.split("/").filter(Boolean);
  const currentLocale = (segments[0] || initialLocale) as Locale;

  // locale 이후의 경로 추출 (예: /ko/feedback -> feedback)
  const pathWithoutLocale = segments.slice(1).join("/");
  const targetPath = pathWithoutLocale ? `/${pathWithoutLocale}` : "";

  const currentLanguage = dictionary.languages[currentLocale];

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
            <Link href={`/${item}${targetPath}`} className={`w-full ${item === currentLocale ? "bg-accent" : ""}`}>
              {dictionary.languages[item]}
              {item === currentLocale && <span className="ml-auto text-xs text-muted-foreground">✓</span>}
            </Link>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
