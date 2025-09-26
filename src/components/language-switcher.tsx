import Link from "next/link";

import { SUPPORTED_LOCALES, type Locale } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n/dictionary";

type LanguageSwitcherDictionary = Dictionary["languageSwitcher"];

type LanguageSwitcherProps = {
  locale: Locale;
  dictionary: LanguageSwitcherDictionary;
};

export function LanguageSwitcher({ locale, dictionary }: LanguageSwitcherProps) {
  return (
    <nav className="flex items-center justify-end gap-2 text-sm text-muted-foreground">
      <span className="font-medium text-foreground">{dictionary.label}</span>
      <ul className="flex items-center gap-1">
        {SUPPORTED_LOCALES.map((item) => (
          <li key={item}>
            <Link
              href={`/${item}`}
              aria-current={item === locale ? "page" : undefined}
              className={`rounded px-2 py-1 transition ${
                item === locale
                  ? "bg-foreground text-background"
                  : "hover:bg-muted hover:text-foreground"
              }`}
            >
              {dictionary.languages[item]}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
