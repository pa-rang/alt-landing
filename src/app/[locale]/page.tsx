import { notFound } from "next/navigation";

import { WaitlistForm } from "@/components/waitlist-form";
import { isSupportedLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionary";

type HomePageProps = {
  params: { locale: string };
};

export default async function HomePage({ params }: { params: Promise<HomePageProps["params"]> }) {
  const { locale } = await params;

  if (!isSupportedLocale(locale)) {
    notFound();
  }

  const dictionary = await getDictionary(locale);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-6 py-12 text-foreground">
      <div className="w-full max-w-2xl space-y-8 text-center">
        <div className="space-y-2">
          <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">{dictionary.home.heroTitle}</h1>
          <p className="text-base text-muted-foreground">{dictionary.home.heroDescription}</p>
        </div>
        <div className="mx-auto w-full">
          <WaitlistForm locale={locale} dictionary={dictionary.waitlistForm} />
        </div>
      </div>
    </div>
  );
}
