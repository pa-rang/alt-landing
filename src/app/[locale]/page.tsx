import { notFound } from "next/navigation";
import Image from "next/image";
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
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      {/* Hero Section */}
      <section className="relative overflow-hidden px-6 py-8 sm:px-8 lg:px-16">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-16 items-center">
            <div className="flex flex-col justify-center space-y-8">
              <div className="space-y-1">
                <h1 className="text-4xl font-bold tracking-tight">
                  <span className="text-zinc-800">No Internet. No Login. </span>
                  <span className="inline-block animate-pulse bg-gradient-to-r from-emerald-500 via-green-500 to-teal-500 bg-clip-text text-transparent">
                    Absolutely Free.
                  </span>
                </h1>
                <div className="flex items-center gap-3">
                  <Image src="/alt_logo.png" alt="alt logo" width={48} height={48} className="inline-block" />
                  <h1 className="text-4xl text-zinc-800">Your private AI lecture notetaker, alt</h1>
                </div>
              </div>
              <div className="w-full max-w-md">
                <WaitlistForm locale={locale} dictionary={dictionary.waitlistForm} />
              </div>
            </div>

            <div className="relative">
              <div className="relative rounded-xl border bg-background/50 shadow-2xl backdrop-blur-sm overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-tr from-primary/10 to-transparent" />
                <Image
                  src="/alt_screenshot.png"
                  alt="AI Transcript Platform Screenshot"
                  width={600}
                  height={600}
                  className="relative z-10 w-full h-auto"
                  priority
                />
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
