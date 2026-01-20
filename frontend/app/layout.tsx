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

export const metadata = {
  title: "CaptionBeast - AI Video Captions",
  description: "Generate viral styling for your videos with AI.",
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
            src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${process.env.NEXT_PUBLIC_ADSENSE_ID || "ca-pub-1920333630540777"}`}
            crossOrigin="anonymous"
            strategy="afterInteractive"
          />
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
