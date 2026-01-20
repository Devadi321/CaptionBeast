import { ClerkProvider } from "@clerk/nextjs";

import { Inter, Roboto_Mono } from "next/font/google";
import Script from "next/script";
import "./globals.css";

const geistSans = Inter({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Roboto_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

import { Metadata } from "next";

export const metadata: Metadata = {
  title: "CaptionBeast | Free Viral AI Captions Generator",
  description: "Generate Alex Hormozi style captions for free. No login required. The best AI video caption generator for TikTok, Reels, and Shorts. 100% Free & Unlimited.",
  keywords: ["AI captions", "video subtitles", "free caption generator", "viral video editor", "auto subtitles", "tiktok captions", "alex hormozi captions", "automatic subtitles"],
  openGraph: {
    title: "CaptionBeast | Make Your Videos Go Viral",
    description: "Generate explosive, word-by-word captions in the style of top creators. 100% Free.",
    url: "https://caption-beast.vercel.app",
    siteName: "CaptionBeast",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "CaptionBeast | Free AI Captions",
    description: "Generate viral AI captions for free. No watermark. No login.",
  },
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body
          className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        >
          <Script
            id="adsense-init"
            async
            src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-1920333630540777"
            crossOrigin="anonymous"
            strategy="afterInteractive"
          />
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
