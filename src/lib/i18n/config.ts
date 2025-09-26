export const SUPPORTED_LOCALES = ["ko", "en"] as const;

export type Locale = (typeof SUPPORTED_LOCALES)[number];

export function isSupportedLocale(locale: string | undefined | null): locale is Locale {
  return SUPPORTED_LOCALES.includes(locale as Locale);
}
