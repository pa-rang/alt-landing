import { headers } from "next/headers";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";

import { isSupportedLocale, SUPPORTED_LOCALES, type Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionary";
import { LanguageSwitcher } from "@/components/language-switcher";
import { FeedbackButton } from "@/components/feedback-button";
import { Toaster } from "@/components/ui/sonner";
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
  title: "alt - ai lecture notetaker",
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
    title: "alt - ai lecture notetaker",
    description:
      "Transform your lectures into organized, searchable notes with AI. Join the waitlist for early access.",
    type: "website",
    locale: "en_US",
    siteName: "alt",
    images: [
      {
        url: "https://altalt.io/alt_product_image.png",
        width: 1200,
        height: 630,
        alt: "alt - ai lecture notetaker",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "alt - ai lecture notetaker",
    description:
      "Transform your lectures into organized, searchable notes with AI. Join the waitlist for early access.",
    creator: "@alt_app",
    images: ["https://altalt.io/alt_product_image.png"],
  },
  verification: {
    google: "your-google-verification-code",
  },
  category: "Education Technology",
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

  return (
    <html lang={htmlLang}>
      <head>
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon/favicon-16px.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon/favicon-32px.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/favicon/favicon-180px.png" />
        <link rel="icon" type="image/png" sizes="512x512" href="/favicon/favicon-512px.png" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#000000" />
        <link rel="canonical" href="https://altalt.io" />
        <meta name="language" content={htmlLang} />
        <meta name="revisit-after" content="7 days" />
        {SUPPORTED_LOCALES.map((supportedLocale) => (
          <link
            key={supportedLocale}
            rel="alternate"
            hrefLang={supportedLocale}
            href={`https://altalt.io/${supportedLocale}/`}
          />
        ))}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebApplication",
              name: "alt - ai lecture notetaker",
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
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <div className="min-h-screen flex flex-col">
          <header className="w-full bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="flex h-14 w-full items-center justify-between px-4">
              <div className="flex items-center space-x-4"></div>
              <div className="flex items-center space-x-4">
                <FeedbackButton locale={htmlLang as Locale} dictionary={dictionary.feedback} />
                <LanguageSwitcher locale={htmlLang as Locale} dictionary={dictionary.languageSwitcher} />
              </div>
            </div>
          </header>
          <main className="flex-1">{children}</main>
        </div>
        <Toaster />
        <Analytics />
      </body>
    </html>
  );
}
