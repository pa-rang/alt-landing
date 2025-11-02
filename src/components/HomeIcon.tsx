"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { KeyboardKey } from "./KeyboardKey";
import { type Locale } from "@/lib/i18n/config";

type HomeIconProps = {
  locale: Locale;
};

export function HomeIcon({ locale: initialLocale }: HomeIconProps) {
  const pathname = usePathname();

  // URL에서 현재 locale 추출
  const segments = pathname.split("/").filter(Boolean);
  const currentLocale = (segments[0] || initialLocale) as Locale;

  return (
    <Link
      href={`/${currentLocale}`}
      className="flex items-center justify-center rounded-md border hover:bg-accent transition-colors"
      aria-label="Home"
    >
      <KeyboardKey size="sm">alt</KeyboardKey>
    </Link>
  );
}
