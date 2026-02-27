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
  title: "GuffGaff — गफगाफ | Connect Nepali People",
  description:
    "A social platform for Nepali people to connect, share thoughts, raise issues, and discuss what matters. Post, like, comment, share, and follow.",
  keywords: [
    "Nepal",
    "social network",
    "GuffGaff",
    "गफगाफ",
    "Nepali community",
    "connect",
    "share",
    "discuss",
    "social media Nepal",
    "नेपाली समुदाय",
  ],
  metadataBase: new URL("https://aawaj-nepal-elswqp0q9-asbinthapa99s-projects.vercel.app"),
  alternates: {
    canonical: "https://aawaj-nepal-elswqp0q9-asbinthapa99s-projects.vercel.app",
  },
  openGraph: {
    type: "website",
    locale: "en_NP",
    url: "https://aawaj-nepal-elswqp0q9-asbinthapa99s-projects.vercel.app",
    title: "GuffGaff — Connect Nepali People",
    description:
      "A social platform for Nepali people to connect, share, and discuss what matters.",
    siteName: "GuffGaff",
  },
  twitter: {
    card: "summary_large_image",
    title: "GuffGaff — Connect Nepali People",
    description: "Social platform for Nepali community",
    creator: "@guffgaff",
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
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Script
          id="structured-data"
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebApplication",
              "name": "GuffGaff",
              "description": "Social platform for Nepali people to connect, share, and discuss",
              "url": "https://aawaj-nepal-elswqp0q9-asbinthapa99s-projects.vercel.app",
              "applicationCategory": "SocialNetworking",
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
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-[#f0f2f5] dark:bg-[#18191a] text-[#1c1e21] dark:text-[#e4e6eb] min-h-[100dvh]`}
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
