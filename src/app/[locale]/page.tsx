import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Shield, Languages, Pen, Gift } from "lucide-react";
import { GameLauncher } from "@/components/GameLauncher";
import { FeatureCard } from "@/components/FeatureCard";
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
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 max-w-7xl mx-auto">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-8 md:pt-18 pb-16 px-4 md:px-8">
        <div className="mx-auto">
          <div className="grid gap-8 md:gap-12 items-center">
            <div className="flex flex-col justify-center space-y-4 md:space-y-8">
              <h1 className="text-2xl md:text-5xl tracking-tight leading-tight text-zinc-800">
                {dictionary.home.focusLecture}
                <br /> {dictionary.home.realTimeNoteTaking}
              </h1>

              {/* <p className="text-sm sm:text-base text-zinc-700">
                {dictionary.home.subDescription} <br />
                {dictionary.home.subDescriptionCta}
              </p> */}

              <div className="w-full max-w-md mt-2">
                <GameLauncher
                  locale={locale}
                  gameDictionary={dictionary.game}
                  buttonLabel={dictionary.waitlistForm.submit.idle}
                  earlyAccessNote={dictionary.waitlistForm.earlyAccessNote}
                />
              </div>
            </div>

            {/* Highlights List */}
            <div className="flex flex-col gap-3 md:gap-4 mt-4 md:mt-6">
              {[
                {
                  title: "#만 시간을 써도 무료",
                  description: "서버, API 비용이 안들기 때문에 가능합니다. 결제도 안 붙였어요.",
                  titleClassName:
                    "bg-gradient-to-r from-orange-600 via-purple-500 to-emerald-500 bg-clip-text text-transparent",
                  descriptionClassName: "text-zinc-800",
                  h2AdditionalClassName: "inline-block",
                },
                {
                  title: "#로컬 AI",
                  description: "AI 모델이 사용자 PC에서 실행됩니다. 인터넷 없어도 동작하고, 저흰 서버도 없습니다.",
                  titleClassName: "",
                  descriptionClassName: "text-zinc-800",
                  h2AdditionalClassName: "text-zinc-800",
                },
                {
                  title: `#${dictionary.home.features.privacy.title}`,
                  description: "모든 내용은 사용자 PC에 저장됩니다.",
                  titleClassName: "",
                  descriptionClassName: "text-zinc-800",
                  h2AdditionalClassName: "text-zinc-800",
                },
                {
                  title: `#${dictionary.home.features.realTimeTranslation.title}`,
                  description: "영어 수업을 듣는게 너무 고통스러웠어요.",
                  titleClassName: "",
                  descriptionClassName: "text-zinc-800",
                  h2AdditionalClassName: "text-zinc-800",
                },
                {
                  title: `#높은 성능`,
                  description: "배터리 소모를 최적화했어요. AI 수정으로 정확도를 높였어요.",
                  titleClassName: "",
                  descriptionClassName: "text-zinc-800",
                  h2AdditionalClassName: "text-zinc-800",
                },
                {
                  title: `#온라인 수업도 문제없이`,
                  description: "시스템 오디오를 지원해요.",
                  titleClassName: "",
                  descriptionClassName: "text-zinc-800",
                  h2AdditionalClassName: "text-zinc-800",
                },
              ].map((item, index) => (
                <h2 key={index} className={`text-xl md:text-2xl tracking-tight ${item.h2AdditionalClassName || ""}`}>
                  <span className={`font-semibold ${item.titleClassName}`}>{item.title}</span>
                  <span className={`ml-3 ${item.descriptionClassName}`}>⏤ {item.description}</span>
                </h2>
              ))}
            </div>

            <div className="relative">
              {/* Features Section */}
              {/* <div className="mb-6 md:mb-8">
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
              </div> */}

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
                  className="text-stone-700 text-sm hover:underline hover:text-zinc-700 transition-colors"
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
