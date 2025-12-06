import { redirect } from "next/navigation";
import { isSupportedLocale } from "@/lib/i18n/config";

type DownloadPageProps = {
  params: { locale: string };
};

export default async function DownloadPage({ params }: { params: Promise<DownloadPageProps["params"]> }) {
  const { locale } = await params;

  if (!isSupportedLocale(locale)) {
    redirect("/");
  }

  redirect(`/${locale}`);
}
