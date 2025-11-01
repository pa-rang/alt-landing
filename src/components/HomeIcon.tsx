"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home } from "lucide-react";
import { type Locale } from "@/lib/i18n/config";

type HomeIconProps = {
  locale: Locale;
};

export function HomeIcon({ locale }: HomeIconProps) {
  const pathname = usePathname();

  // 홈 페이지에서는 아이콘을 숨김
  // pathname이 /{locale} 또는 /{locale}/ 형식인 경우 홈 페이지로 간주
  const segments = pathname.split("/").filter(Boolean);
  const isHomePage = segments.length === 1 && segments[0] === locale;

  if (isHomePage) {
    return null;
  }

  return (
    <Link
      href={`/${locale}`}
      className="flex items-center justify-center w-8 h-8 rounded-md border hover:bg-accent transition-colors"
      aria-label="Home"
    >
      <Home className="w-5 h-5 text-foreground" />
    </Link>
  );
}
