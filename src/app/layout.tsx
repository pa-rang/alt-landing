import { headers } from "next/headers";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import Script from "next/script";

import { isSupportedLocale, SUPPORTED_LOCALES, type Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionary";
import { Header } from "@/components/Header";
import { RecruitmentBanner } from "@/components/RecruitmentBanner";
import { Toaster } from "@/components/ui/sonner";
import { createClient } from "@/lib/supabase/server";
import { query } from "@/lib/db";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Alt - AI Lecture Notetaker",
  description:
    "Transform your lectures into organized, searchable notes with AI. alt automatically transcribes, summarizes, and structures your academic content for better learning outcomes.",
  keywords: [
    "AI lecture notes",
    "automatic transcription",
    "study assistant",
    "note taking app",
    "lecture transcription",
    "AI study tools",
    "academic productivity",
    "smart notes",
  ],
  authors: [{ name: "alt team" }],
  creator: "alt",
  publisher: "alt",
  robots: "index, follow",
  openGraph: {
    title: "Alt - AI Lecture Notetaker",
    description:
      "Transform your lectures into organized, searchable notes with AI. Join the waitlist for early access.",
    type: "website",
    locale: "en_US",
    siteName: "alt",
    images: [
      {
        url: "https://altalt.io/alt_reddit.png",
        width: 1200,
        height: 630,
        alt: "Alt - AI Lecture Notetaker",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Alt - AI Lecture Notetaker",
    description:
      "Transform your lectures into organized, searchable notes with AI. Join the waitlist for early access.",
    creator: "@alt_app",
    images: ["https://altalt.io/alt_reddit.png"],
  },
  verification: {
    google: "your-google-verification-code",
  },
  category: "Education Technology",
  metadataBase: new URL("https://altalt.io"),
  alternates: {
    canonical: "/",
    languages: {
      en: "/en",
      ko: "/ko",
    },
  },
  icons: {
    icon: [
      { url: "/favicon/favicon-16px.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon/favicon-32px.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon/favicon-512px.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/favicon/favicon-180px.png", sizes: "180x180", type: "image/png" }],
  },
  other: {
    language: "en",
    "revisit-after": "7 days",
  },
};

export default async function RootLayout({
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

  // 인증 상태 확인
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
      console.error("❌ [LAYOUT] Failed to load subscription status:", error);
    }
  }

  return (
    <html lang={htmlLang} suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <Script src="https://www.googletagmanager.com/gtag/js?id=G-G0XD46659S" strategy="afterInteractive" />
        <Script
          id="google-analytics"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', 'G-G0XD46659S');
            `,
          }}
        />
        <Script
          id="structured-data"
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebApplication",
              name: "Alt - AI Lecture Notetaker",
              description:
                "Transform your lectures into organized, searchable notes with AI. alt automatically transcribes, summarizes, and structures your academic content for better learning outcomes.",
              url: "https://altalt.io",
              applicationCategory: "EducationalApplication",
              operatingSystem: "Web",
              offers: {
                "@type": "Offer",
                price: "0",
                priceCurrency: "USD",
              },
              creator: {
                "@type": "Organization",
                name: "alt team",
              },
            }),
          }}
        />
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
        <Toaster />
        <Analytics />
      </body>
    </html>
  );
}
