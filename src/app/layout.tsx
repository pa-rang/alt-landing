import { headers } from "next/headers";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";

import { isSupportedLocale } from "@/lib/i18n/config";
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
  title: "alt, ai lecture notetaker",
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
    title: "alt, ai lecture notetaker",
    description:
      "Transform your lectures into organized, searchable notes with AI. Join the waitlist for early access.",
    type: "website",
    locale: "en_US",
    siteName: "alt",
  },
  twitter: {
    card: "summary_large_image",
    title: "alt, ai lecture notetaker",
    description:
      "Transform your lectures into organized, searchable notes with AI. Join the waitlist for early access.",
    creator: "@alt_app",
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
        <meta name="language" content="en" />
        <meta name="revisit-after" content="7 days" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebApplication",
              name: "alt, ai lecture notetaker",
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
        {children}
        <Toaster />
      </body>
    </html>
  );
}
