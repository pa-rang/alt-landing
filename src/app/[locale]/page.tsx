import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Shield, Languages, Pen, Gift } from "lucide-react";
import { WaitlistForm } from "@/components/waitlist-form";
import { FeatureCard } from "@/components/feature-card";
import { KeyboardKey } from "@/components/keyboard-key";
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
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-2 md:pt-12 pb-16 px-4 sm:px-8 lg:px-16">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-8 md:gap-16 items-center">
            <div className="flex flex-col justify-center space-y-4 md:space-y-8">
              <div className="space-y-1">
                <h1 className="text-4xl font-bold tracking-tight text-zinc-800">{dictionary.home.focusLecture}</h1>
                {/* Mobile: inline text with keyboard key */}
                <h1 className="text-[20px] mt-4 text-zinc-800 md:hidden">
                  <KeyboardKey size="sm" className="align-middle">
                    alt
                  </KeyboardKey>
                  {dictionary.home.realTimeNoteTaking}
                </h1>

                {/* Desktop: flex layout */}
                <div className="hidden md:flex items-center">
                  <KeyboardKey size="lg">alt</KeyboardKey>
                  <h1 className="text-2xl md:text-4xl text-zinc-800">{dictionary.home.realTimeNoteTaking}</h1>
                </div>

                <h1 className="text-4xl font-bold tracking-tight">
                  <span className="inline-block bg-gradient-to-r from-indigo-500 via-blue-500 to-cyan-500 bg-clip-text text-transparent">
                    {dictionary.home.completelyFree}
                  </span>
                  <span className="text-zinc-800">{dictionary.home.noLoginRequired}</span>
                </h1>
              </div>

              <p className="text-sm sm:text-base text-zinc-700">
                {dictionary.home.subDescription} <br />
                {dictionary.home.subDescriptionCta}
              </p>

              <div className="w-full max-w-md mt-2">
                <WaitlistForm
                  locale={locale}
                  dictionary={dictionary.waitlistForm}
                  dialogTexts={dictionary.waitlistDialog}
                  gameDictionary={dictionary.game}
                />
              </div>
            </div>
            <div className="relative">
              {/* Features Section */}
              <div className="mb-6 md:mb-8">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
                  <FeatureCard
                    icon={Shield}
                    title={dictionary.home.features.privacy.title}
                    description={dictionary.home.features.privacy.description}
                  />
                  <FeatureCard
                    icon={Gift}
                    title={dictionary.home.features.completelyFree.title}
                    description={dictionary.home.features.completelyFree.description}
                  />
                  <FeatureCard
                    icon={Languages}
                    title={dictionary.home.features.realTimeTranslation.title}
                    description={dictionary.home.features.realTimeTranslation.description}
                  />
                  <FeatureCard
                    icon={Pen}
                    title={dictionary.home.features.aiEditing.title}
                    description={dictionary.home.features.aiEditing.description}
                  />
                </div>
              </div>

              <div className="relative rounded-xl border bg-background/50 shadow-2xl backdrop-blur-sm overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-tr from-primary/10 to-transparent" />
                <Image
                  src="/alt_product_image.png"
                  alt="AI Transcript Platform Screenshot"
                  width={1600}
                  height={964}
                  className="relative z-10 w-full h-auto"
                  quality={100}
                  priority
                  unoptimized={false}
                />
              </div>

              {/* About us text */}
              <div className="mt-14">
                <Link
                  href={`/${locale}/about`}
                  className="text-zinc-800 underline hover:text-zinc-700 transition-colors"
                >
                  {dictionary.home.aboutUs}
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
