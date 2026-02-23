import type { Metadata } from "next";
import Script from "next/script";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";
import { AuthProvider } from "@/components/AuthProvider";
import Navbar from "@/components/Navbar";
import CookieConsent from "@/components/CookieConsent";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Awaaz Nepal — आवाज नेपाल | Voice for Citizens & Social Change",
  description:
    "Democratic platform empowering Nepali citizens to raise voices about public issues, track accountability, and drive community-led change. Post problems, support causes, share evidence.",
  keywords: [
    "Nepal",
    "civic engagement",
    "citizen voice",
    "social issues",
    "community",
    "accountability",
    "transparency",
    "government feedback",
    "youth activism",
    "Nepal problems",
    "नेपाल",
    "नागरिक",
    "सामाजिक परिवर्तन",
  ],
  metadataBase: new URL("https://awaaz-nepal.vercel.app"),
  canonical: "https://awaaz-nepal.vercel.app",
  alternates: {
    languages: {
      en: "https://awaaz-nepal.vercel.app/en",
      ne: "https://awaaz-nepal.vercel.app/ne",
    },
  },
  openGraph: {
    type: "website",
    locale: "en_NP",
    url: "https://awaaz-nepal.vercel.app",
    title: "Awaaz Nepal — Voice for Citizens",
    description:
      "Empower Nepali citizens to raise voices about public issues and drive community change",
    siteName: "Awaaz Nepal",
    images: [
      {
        url: "https://awaaz-nepal.vercel.app/og-image.png",
        width: 1200,
        height: 630,
        alt: "Awaaz Nepal - Voice for Citizens",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Awaaz Nepal — Voice for Citizens",
    description: "Civic engagement platform for Nepali youth",
    creator: "@awaaznepal",
    images: ["https://awaaz-nepal.vercel.app/twitter-image.png"],
  },
  robots: "index, follow, max-image-preview:large",
  authors: [{ name: "Asbin Thapa", url: "https://github.com/asbinthapa99" }],
  creator: "Asbin Thapa",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <Script 
          id="structured-data"
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebApplication",
              "name": "Awaaz Nepal",
              "description": "Democratic platform empowering Nepali citizens to raise voices about public issues",
              "url": "https://awaaz-nepal.vercel.app",
              "applicationCategory": "CivicTech",
              "offers": {
                "@type": "Offer",
                "price": "0",
              },
              "creator": {
                "@type": "Person",
                "name": "Asbin Thapa",
                "url": "https://github.com/asbinthapa99",
              },
              "inLanguage": ["en", "ne"],
              "availableLanguage": [
                {
                  "@type": "Language",
                  "name": "English",
                  "alternateName": "en",
                },
                {
                  "@type": "Language",
                  "name": "Nepali",
                  "alternateName": "ne",
                },
              ],
            }),
          }}
        />
        <Script 
          src="https://widgets.tradingview-widget.com/w/en/tv-mini-chart.js" 
          async
          strategy="lazyOnload"
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-white min-h-screen`}
      >
        <ThemeProvider>
          <AuthProvider>
            <Navbar />
            <main>{children}</main>
            <CookieConsent />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
