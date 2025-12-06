import { headers } from "next/headers";
import { isSupportedLocale, SUPPORTED_LOCALES, type Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionary";
import { Header } from "@/components/Header";
import { RecruitmentBanner } from "@/components/RecruitmentBanner";
import { createClient } from "@/lib/supabase/server";
import { query } from "@/lib/db";

export default async function MainLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const headerList = await headers();
  const locale = headerList.get("x-next-locale");
  const htmlLang = isSupportedLocale(locale) ? locale : "en";

  const dictionary = await getDictionary(htmlLang as Locale);

  // 각 locale의 피드백 버튼 라벨 가져오기
  const feedbackLabels = await Promise.all(
    SUPPORTED_LOCALES.map(async (loc) => {
      const dict = await getDictionary(loc);
      return { locale: loc, label: dict.feedback.button };
    })
  );
  const labels = feedbackLabels.reduce((acc, { locale, label }) => {
    acc[locale] = label;
    return acc;
  }, {} as Record<Locale, string>);

  // 각 locale의 게임 버튼 라벨 가져오기
  const gameLabels = await Promise.all(
    SUPPORTED_LOCALES.map(async (loc) => {
      const dict = await getDictionary(loc);
      return { locale: loc, label: dict.game.gameButton };
    })
  );
  const gameButtonLabels = gameLabels.reduce((acc, { locale, label }) => {
    acc[locale] = label;
    return acc;
  }, {} as Record<Locale, string>);

  const showBanner = htmlLang === "ko";

  // 인증 상태 확인 (middleware에서 세션 갱신됨)
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const isAuthenticated = !!user;
  const userEmail = user?.email ?? null;
  let subscriptionStatus: string | null = null;

  if (user) {
    try {
      const result = await query<{ subscription_status: string | null }>(
        "select subscription_status from user_profiles where id = $1",
        [user.id]
      );
      subscriptionStatus = result.rows[0]?.subscription_status ?? "free";
    } catch (error) {
      console.error("❌ [MAIN-LAYOUT] Failed to load subscription status:", error);
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      {showBanner && <RecruitmentBanner />}
      <Header
        locale={htmlLang as Locale}
        dictionary={dictionary}
        gameButtonLabels={gameButtonLabels}
        feedbackLabels={labels}
        hasBanner={showBanner}
        isAuthenticated={isAuthenticated}
        userEmail={userEmail}
        subscriptionStatus={subscriptionStatus ?? undefined}
      />
      <main className="flex-1">{children}</main>
    </div>
  );
}

