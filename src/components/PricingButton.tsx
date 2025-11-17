"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

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
    <Button variant="outline" size="sm" className="gap-2 rounded-full shadow-none text-[13px]" asChild>
      <Link href={`/${currentLocale}/pricing`}>{label}</Link>
    </Button>
  );
}

