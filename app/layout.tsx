import type { Metadata, Viewport } from "next";
import { Rajdhani } from "next/font/google";
import React from "react";
import "./globals.css";
import { Providers } from "./providers";
import { initFeatureFlags } from "@/lib/featureFlags.config";
import { getAllFlagValues } from "@/lib/featureFlags";
import { MockModeIndicator } from "@/features/testing/components/MockModeIndicator";

const rajdhani = Rajdhani({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://novibenocode.com"),
  title: {
    default: "No Vibe No Code | AI-Powered Product Management Platform",
    template: "%s | No Vibe No Code",
  },
  description:
    "Go from idea to Kiro boilerplate. AI-powered idea analysis and validation to kickstart your agentic development workflow.",
  manifest: "/manifest.webmanifest",
  authors: [{ name: "No Vibe No Code" }],
  creator: "No Vibe No Code",
  publisher: "No Vibe No Code",
  alternates: {
    canonical: "/",
    languages: {
      en: "/en",
      es: "/es",
    },
  },
  category: "Technology",
  keywords: [
    "AI product management",
    "startup idea analyzer",
    "idea validation",
    "Kiro boilerplate",
    "agentic development",
    "hackathon analyzer",
    "AI documentation",
    "product planning",
    "MVP validation",
    "startup tools",
    "idea to execution",
  ],
  openGraph: {
    title: "No Vibe No Code | AI-Powered Product Management Platform",
    description:
      "Go from idea to Kiro boilerplate. AI-powered idea analysis and validation to kickstart your agentic development workflow.",
    url: "https://novibenocode.com/",
    siteName: "No Vibe No Code",
    type: "website",
    locale: "en_US",
    images: [
      {
        url: "https://novibenocode.com/screenshots/dashboard-light.png",
        width: 1920,
        height: 1080,
        alt: "No Vibe No Code - AI-powered product management dashboard",
      },
      {
        url: "https://novibenocode.com/screenshots/mobile-overview.png",
        width: 1242,
        height: 2688,
        alt: "No Vibe No Code mobile app - manage ideas on the go",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "No Vibe No Code | AI-Powered Product Management",
    description:
      "Go from idea to Kiro boilerplate. AI-powered idea analysis and validation to kickstart agentic development.",
    images: ["https://novibenocode.com/screenshots/dashboard-light.png"],
    creator: "@novibenocode",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: [
      { url: "/icons/icon-48x48.png", sizes: "48x48" },
      { url: "/icons/icon-72x72.png", sizes: "72x72" },
      { url: "/icons/icon-96x96.png", sizes: "96x96" },
      { url: "/icons/icon-128x128.png", sizes: "128x128" },
      { url: "/icons/icon-144x144.png", sizes: "144x144" },
      { url: "/icons/icon-152x152.png", sizes: "152x152" },
      { url: "/icons/icon-192x192.png", sizes: "192x192" },
      { url: "/icons/icon-256x256.png", sizes: "256x256" },
      { url: "/icons/icon-384x384.png", sizes: "384x384" },
      { url: "/icons/icon-512x512.png", sizes: "512x512" },
    ],
    apple: [
      { url: "/icons/icon-152x152.png", sizes: "152x152" },
      { url: "/icons/icon-192x192.png", sizes: "192x192" },
    ],
    shortcut: "/icons/icon-192x192.png",
    other: [
      {
        rel: "mask-icon",
        url: "/icons/safari-pinned-tab.svg",
        color: "#0d0d2b",
      },
    ],
  },
};

export const viewport: Viewport = {
  themeColor: "#0d0d2b",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Ensure flags are registered on the server and pass stable values to client
  initFeatureFlags();
  const flagValues = getAllFlagValues();
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={rajdhani.className}>
        <script
          // Inject stable flag values for client to adopt and avoid hydration mismatches
          dangerouslySetInnerHTML={{
            __html: `window.__FF__ = ${JSON.stringify(flagValues)};`,
          }}
        />
        <Providers>{children}</Providers>
        <MockModeIndicator />
      </body>
    </html>
  );
}
