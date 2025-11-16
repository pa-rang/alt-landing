import { notFound } from "next/navigation";
import { isSupportedLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionary";
import { AuthPageClient } from "./AuthPageClient";

type AuthPageProps = {
  params: { locale: string };
};

export default async function AuthPage({ params }: { params: Promise<AuthPageProps["params"]> }) {
  const { locale } = await params;

  if (!isSupportedLocale(locale)) {
    notFound();
  }

  const dictionary = await getDictionary(locale);

  return <AuthPageClient locale={locale} dictionary={dictionary} />;
}
