import type { Metadata, Viewport } from "next";
import { Fraunces, Manrope } from "next/font/google";

import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { TAGLINE } from "@/lib/copy";
import { siteUrl } from "@/lib/site";

import "./globals.css";

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope",
  display: "swap",
});

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  display: "swap",
});

const publicSite = siteUrl();

const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Pro Resume Tailor",
  url: publicSite,
  logo: `${publicSite}/logo.png`,
  description: TAGLINE,
};

export const metadata: Metadata = {
  metadataBase: new URL(publicSite),
  title: {
    default: "Pro Resume Tailor",
    template: "%s · Pro Resume Tailor",
  },
  description: TAGLINE,
  applicationName: "Pro Resume Tailor",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: publicSite,
    siteName: "Pro Resume Tailor",
    title: "Pro Resume Tailor",
    description: TAGLINE,
  },
  twitter: {
    card: "summary_large_image",
    title: "Pro Resume Tailor",
    description: TAGLINE,
  },
};

export const viewport: Viewport = {
  themeColor: "#12241c",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${manrope.variable} ${fraunces.variable} h-full`}>
      <body className="flex min-h-full flex-col bg-paper font-sans text-ink antialiased">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd).replace(/</g, "\\u003c") }}
        />
        <a
          href="#content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:z-50 focus:rounded-full focus:bg-card focus:px-4 focus:py-2 focus:shadow-lg"
        >
          Skip to content
        </a>
        <SiteHeader />
        <main id="content" className="flex-1">
          {children}
        </main>
        <SiteFooter />
      </body>
    </html>
  );
}
