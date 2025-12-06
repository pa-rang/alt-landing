import { notFound } from "next/navigation";
import { isSupportedLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionary";
import { GamePageClient } from "./GamePageClient";

type GamePageProps = {
  params: { locale: string };
};

export default async function GamePage({ params }: { params: Promise<GamePageProps["params"]> }) {
  const { locale } = await params;

  if (!isSupportedLocale(locale)) {
    notFound();
  }

  const dictionary = await getDictionary(locale);

  return (
    <div className="min-h-screen bg-background">
      <GamePageClient locale={locale} dictionary={dictionary.game} fullDictionary={dictionary} />
    </div>
  );
}
