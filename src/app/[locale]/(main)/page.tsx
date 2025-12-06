import { notFound } from "next/navigation";
import { DownloadButton } from "@/components/game/DownloadButton";
import { AboutLetter } from "@/components/AboutLetter";
import { CopyableCode } from "@/components/CopyableCode";
import { CopyableInlineCode } from "@/components/CopyableInlineCode";
import { DemoVideo } from "@/components/video/DemoVideo";
import { isSupportedLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionary";
import { accentGradient } from "@/lib/utils";

type HomePageProps = {
  params: { locale: string };
};

export default async function HomePage({ params }: { params: Promise<HomePageProps["params"]> }) {
  const { locale } = await params;

  if (!isSupportedLocale(locale)) {
    notFound();
  }

  const dictionary = await getDictionary(locale);

  const highlights = [
    {
      title: dictionary.home.highlights.free.title,
      description: dictionary.home.highlights.free.description,
      titleClassName: accentGradient.text,
      descriptionClassName: "text-zinc-800",
      h2AdditionalClassName: "inline-block",
    },
    {
      title: dictionary.home.highlights.localAi.title,
      description: dictionary.home.highlights.localAi.description,
      titleClassName: "",
      descriptionClassName: "text-zinc-800",
      h2AdditionalClassName: "text-zinc-800",
    },
    {
      title: dictionary.home.features.privacy.title,
      description: dictionary.home.highlights.privacy.description,
      titleClassName: "",
      descriptionClassName: "text-zinc-800",
      h2AdditionalClassName: "text-zinc-800",
    },
    {
      title: dictionary.home.highlights.performance.title,
      description: dictionary.home.highlights.performance.description,
      titleClassName: "",
      descriptionClassName: "text-zinc-800",
      h2AdditionalClassName: "text-zinc-800",
    },
    {
      title: dictionary.home.features.realTimeTranslation.title,
      titleClassName: "",
      descriptionClassName: "text-zinc-800",
      h2AdditionalClassName: "text-zinc-800",
    },
    {
      title: dictionary.home.highlights.online.title,
      titleClassName: "",
      descriptionClassName: "text-zinc-800",
      h2AdditionalClassName: "text-zinc-800",
    },
    {
      title: dictionary.home.highlights.languages.title,
      titleClassName: "",
      descriptionClassName: "text-zinc-800",
      h2AdditionalClassName: "text-zinc-800",
    },
  ];

  return (
    <div className="min-h-screen bg-linear-to-b from-background to-muted/30 max-w-7xl mx-auto">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 md:pt-24 pb-16 px-4 md:px-8">
        <div className="mx-auto">
          <div className="grid gap-8 md:gap-12 items-center">
            <div className="flex flex-col justify-center space-y-4 md:space-y-8">
              <h1 className="font-semibold text-3xl md:text-5xl tracking-tight leading-tight text-zinc-800">
                {dictionary.home.focusLecture}
                <br /> {dictionary.home.realTimeNoteTaking}
              </h1>

              <div className="w-full max-w-md mt-10">
                {/* 모바일: inline code block 사용 */}
                <div className="md:hidden flex flex-col items-start gap-3">
                  <DownloadButton
                    className="whitespace-nowrap relative overflow-visible text-[#f2f1ed] font-mono font-semibold text-base bg-gradient-to-b from-zinc-800 to-zinc-900 border-2 border-zinc-700 rounded-lg px-6 py-5 shadow-[0_3px_0_0_#27272a,0_4px_6px_rgba(0,0,0,0.3)] hover:shadow-[inset_0_2px_3px_rgba(0,0,0,0.4)] active:shadow-[inset_0_2px_3px_rgba(0,0,0,0.4)] transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-[0_3px_0_0_#27272a,0_4px_6px_rgba(0,0,0,0.3)]"
                    location="home-mobile"
                  >
                    {dictionary.waitlistForm.submit.idle}
                  </DownloadButton>
                  <span className="text-zinc-600 font-medium text-[13px]">
                    or <CopyableInlineCode code="brew install --cask altalt-org/alt/alt" />
                  </span>
                </div>

                {/* 데스크탑: CopyableCode 사용 */}
                <div className="hidden md:flex md:flex-row items-center gap-3">
                  <DownloadButton
                    className="whitespace-nowrap relative overflow-visible text-[#f2f1ed] font-mono font-semibold text-base bg-gradient-to-b from-zinc-800 to-zinc-900 border-2 border-zinc-700 rounded-lg px-6 py-5 shadow-[0_3px_0_0_#27272a,0_4px_6px_rgba(0,0,0,0.3)] hover:shadow-[inset_0_2px_3px_rgba(0,0,0,0.4)] active:shadow-[inset_0_2px_3px_rgba(0,0,0,0.4)] transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-[0_3px_0_0_#27272a,0_4px_6px_rgba(0,0,0,0.3)]"
                    location="home"
                  >
                    {dictionary.waitlistForm.submit.idle}
                  </DownloadButton>
                  <span className="text-zinc-600 font-medium">or</span>
                  <CopyableCode code="brew install --cask altalt-org/alt/alt" />
                </div>
                <p className="text-[13px] text-muted-foreground mt-2">{dictionary.waitlistForm.earlyAccessNote}</p>
              </div>
            </div>

            <div className="md:hidden relative rounded-xl border bg-background/50 backdrop-blur-sm overflow-hidden">
              <div className="absolute inset-0 bg-linear-to-tr from-primary/10 to-transparent" />
              <DemoVideo
                src="https://cdn.altalt.io/resources/Alt-landing.mp4"
                fallbackImage="/alt_reddit.png"
                className="relative z-10"
              />
            </div>

            {/* Highlights List */}
            <div className="flex flex-col gap-2 md:gap-4 mt-4 md:mt-6">
              {highlights.map((item, index) => (
                <h2 key={index} className={`text-lg md:text-2xl tracking-tight ${item.h2AdditionalClassName || ""}`}>
                  <span className={`font-semibold ${item.titleClassName}`}># {item.title}</span>
                  {item.description && (
                    <span className={`ml-3 ${item.descriptionClassName}`}>⏤ {item.description}</span>
                  )}
                </h2>
              ))}
            </div>

            <div className="relative ">
              <div className="hidden md:block relative rounded-xl border bg-background/50 backdrop-blur-sm overflow-hidden">
                <div className="absolute inset-0 bg-linear-to-tr from-primary/10 to-transparent" />
                <DemoVideo
                  src="https://cdn.altalt.io/resources/Alt-landing.mp4"
                  fallbackImage="/alt_reddit.png"
                  className="relative z-10"
                />
              </div>

              <div className="h-6 md:h-20" />

              {/* About us text */}
              <AboutLetter locale={locale} />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
