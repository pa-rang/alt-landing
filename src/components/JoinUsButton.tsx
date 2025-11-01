"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { type Locale } from "@/lib/i18n/config";
import { Button } from "@/components/ui/button";

type JoinUsButtonProps = {
  locale: Locale;
};

export function JoinUsButton({ locale: initialLocale }: JoinUsButtonProps) {
  const pathname = usePathname();

  // about 페이지에서는 버튼을 표시하지 않음
  if (pathname.includes("/about")) {
    return null;
  }

  // URL에서 현재 locale 추출
  const segments = pathname.split("/").filter(Boolean);
  const currentLocale = (segments[0] || initialLocale) as Locale;

  return (
    <Button variant="outline" size="sm" className="gap-2 rounded-full shadow-none text-[13px]" asChild>
      <Link href={`/${currentLocale}/about`}>
        <span>Join us</span>
      </Link>
    </Button>
  );
}
