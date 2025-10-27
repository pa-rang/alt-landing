import { notFound } from "next/navigation";
import { isSupportedLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionary";
import { FeedbackForm } from "@/components/feedback-form";

type FeedbackPageProps = {
  params: { locale: string };
};

export default async function FeedbackPage({ params }: { params: Promise<FeedbackPageProps["params"]> }) {
  const { locale } = await params;

  if (!isSupportedLocale(locale)) {
    notFound();
  }

  const dictionary = await getDictionary(locale);

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      <section className="relative overflow-hidden pt-8 md:pt-16 pb-16 px-4 sm:px-8 lg:px-16">
        <div className="mx-auto max-w-2xl">
          <div className="space-y-8">
            {/* 제목 */}
            <div className="space-y-2 text-center">
              <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-zinc-800">
                {dictionary.feedback.title}
              </h1>
            </div>

            {/* 폼 영역 */}
            <FeedbackForm locale={locale} dictionary={dictionary.feedback.form} />
          </div>
        </div>
      </section>
    </div>
  );
}
