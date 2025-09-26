import { isSupportedLocale, type Locale } from "./config";

export function detectLocaleFromAcceptLanguage(value: string | null | undefined): Locale | null {
  if (!value) {
    return null;
  }

  const locales = value
    .split(",")
    .map((part) => part.split(";")[0]?.trim().toLowerCase())
    .filter(Boolean);

  for (const locale of locales) {
    const primaryTag = locale.split("-")[0];
    if (isSupportedLocale(primaryTag)) {
      return primaryTag;
    }
  }

  return null;
}

export function resolveLocale(options: {
  headerLocale?: string | null;
  cookieLocale?: string | null;
  country?: string | null;
}): Locale {
  if (isSupportedLocale(options.cookieLocale)) {
    return options.cookieLocale;
  }

  const headerLocale = detectLocaleFromAcceptLanguage(options.headerLocale);
  if (headerLocale) {
    return headerLocale;
  }

  if (options.country === "KR") {
    return "ko";
  }

  return "en";
}
