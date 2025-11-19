"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CakeSlice } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { Locale } from "@/lib/i18n/config";

type PricingButtonProps = {
  locale: Locale;
  label: string;
};

export function PricingButton({ locale: initialLocale, label }: PricingButtonProps) {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);
  const currentLocale = (segments[0] || initialLocale) as Locale;

  return (
    <Button
      variant="outline"
      size="sm"
      className="gap-1.5 rounded-full shadow-none text-[13px] bg-gradient-to-r from-orange-600/10 via-purple-500/15 to-emerald-500/15 border-transparent relative overflow-hidden group"
      asChild
    >
      <Link href={`/${currentLocale}/pricing`} className="relative z-10 flex items-center">
        <CakeSlice className="size-3.5 text-purple-500" />
        <span className="font-semibold bg-gradient-to-r from-orange-600 via-purple-500 to-emerald-500 bg-clip-text text-transparent">
          {label}
        </span>
      </Link>
    </Button>
  );
}
