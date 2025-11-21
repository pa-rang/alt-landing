"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CakeSlice } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { Locale } from "@/lib/i18n/config";
import { accentGradient } from "@/lib/utils";

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
      className={`gap-1.5 rounded-full shadow-none text-[13px] ${accentGradient.background} border-transparent relative overflow-hidden group`}
      asChild
    >
      <Link href={`/${currentLocale}/pricing`} className="relative z-10 flex items-center">
        <CakeSlice className="size-3.5 text-purple-500" />
        <span className={`font-semibold ${accentGradient.text}`}>{label}</span>
      </Link>
    </Button>
  );
}
