import type { Locale } from "./config";

const dictionaries = {
  ko: () => import("@/locales/ko.json").then((module) => module.default),
  en: () => import("@/locales/en.json").then((module) => module.default),
} as const;

export type Dictionary = Awaited<ReturnType<(typeof dictionaries)[Locale]>>;

export async function getDictionary(locale: Locale): Promise<Dictionary> {
  const loadDictionary = dictionaries[locale];
  return loadDictionary();
}
