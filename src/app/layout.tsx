import type { Metadata } from "next";
import "./globals.css";
import Script from "next/script";

import { fontHeading, fontSans } from "@/lib/fonts";
import Providers from "@/components/providers";

export const metadata: Metadata = {
  title: "Rathagala - Sri Lanka's Trusted Classifieds Platform",
  description:
    "Rathagala is Sri Lanka's premier online marketplace for buying and selling everything you need. Find vehicles, electronics, jobs, real estate, and more. Post free ads, connect with local buyers and sellers, and discover great deals in your community. Your trusted platform for classifieds in Sri Lanka.",
  keywords: [
    "classifieds Sri Lanka",
    "buy sell Sri Lanka",
    "online marketplace Sri Lanka",
    "used cars Sri Lanka",
    "jobs Sri Lanka",
    "real estate Sri Lanka",
    "vehicles for sale",
    "electronics Sri Lanka",
    "free classifieds",
    "online ads Sri Lanka",
    "rathagala"
  ],
  openGraph: {
    title: "Rathagala - Sri Lanka's Trusted Classifieds Platform",
    description:
      "Rathagala is Sri Lanka's premier online marketplace for buying and selling everything you need. Find vehicles, electronics, jobs, real estate, and more.",
    type: "website",
    siteName: "Rathagala",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Rathagala - Buy and Sell in Sri Lanka",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Rathagala - Sri Lanka's Trusted Classifieds Platform",
    description:
      "Rathagala is Sri Lanka's premier online marketplace for buying and selling everything you need. Find vehicles, electronics, jobs, real estate, and more.",
    images: ["/og-image.png"],
  },
};

const GA_ID = "G-LZXVEML5E1";

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${fontHeading.variable} ${fontSans.variable} font-sans antialiased`}
        suppressHydrationWarning
      >
        {/* Google Analytics */}
        <Script
          src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${GA_ID}');
          `}
        </Script>

        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
