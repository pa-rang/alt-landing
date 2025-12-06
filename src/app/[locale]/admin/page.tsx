import { notFound } from "next/navigation";
import { isSupportedLocale } from "@/lib/i18n/config";

export const dynamic = "force-dynamic";

type AdminPageProps = {
  params: Promise<{ locale: string }>;
};

/**
 * 어드민 페이지
 * layout.tsx의 AdminGuard에 의해 보호됩니다.
 */
export default async function AdminPage({ params }: AdminPageProps) {
  const { locale } = await params;

  if (!isSupportedLocale(locale)) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-4">Admin Page</h1>
        <p className="text-muted-foreground">어드민 페이지입니다.</p>
      </div>
    </div>
  );
}
