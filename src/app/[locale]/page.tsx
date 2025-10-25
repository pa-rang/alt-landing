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
      <section className="relative overflow-hidden pt-2 md:pt-12 pb-16 px-4 sm:px-8 lg:px-16">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-8 md:gap-16 items-center">
            <div className="flex flex-col justify-center space-y-4 md:space-y-8">
              <div className="space-y-1">
                <h1 className="text-4xl font-bold tracking-tight text-zinc-800">강의에만 집중하세요.</h1>
                {/* Mobile: inline text with image */}
                <h1 className="text-[20px] mt-4 text-zinc-800 md:hidden">
                  <Image src="/alt_logo.png" alt="alt" width={48} height={48} className="inline-block align-middle" />가
                  실시간으로 필기하고, 정리합니다.
                </h1>

                {/* Desktop: flex layout */}
                <div className="hidden md:flex items-center">
                  <Image src="/alt_logo.png" alt="alt" width={60} height={60} className="inline-block" />
                  <h1 className="text-2xl md:text-4xl text-zinc-800">가 실시간으로 필기하고, 정리합니다.</h1>
                </div>

                <h1 className="text-4xl font-bold tracking-tight">
                  <span className="inline-block bg-gradient-to-r from-indigo-500 via-blue-500 to-cyan-500 bg-clip-text text-transparent">
                    100% 무료.
                  </span>
                  <span className="text-zinc-800"> 로그인, 인터넷 아무것도 필요없어요.</span>
                </h1>
              </div>

              <p className="text-sm sm:text-base text-zinc-500">
                {dictionary.home.subDescription} <br />
                {dictionary.home.subDescriptionCta}
              </p>

              <div className="w-full max-w-md mt-2">
                <WaitlistForm
                  locale={locale}
                  dictionary={dictionary.waitlistForm}
                  dialogTexts={dictionary.waitlistDialog}
                />
              </div>
            </div>
            <div className="relative">
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

              {/* Contact us text */}
              <div className="mt-14">
                <a
                  href="mailto:altalt.team@gmail.com"
                  className="text-sm text-zinc-500 hover:text-zinc-700 transition-colors"
                >
                  Contact us
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
