import type { Metadata, Viewport } from "next";
import { headers } from "next/headers";
import "./globals.css";

const SITE_NAME = "VIBETIME";
const SITE_TITLE = "VIBETIME | 숏폼 영상 부업 플랫폼";
const SITE_DESCRIPTION =
  "AI 영상 제작부터 숏폼 배포·판매·추천 수익까지, 나만의 영상 부업을 시작하는 VIBETIME입니다.";

function getSiteUrl(): URL {
  const configured = process.env.NEXT_PUBLIC_SITE_URL;
  if (configured) {
    try { return new URL(configured); } catch { /* use the request host */ }
  }
  const requestHeaders = headers();
  const host = requestHeaders.get("x-forwarded-host") || requestHeaders.get("host") || "localhost:3027";
  const protocol = requestHeaders.get("x-forwarded-proto") || (host.includes("localhost") ? "http" : "https");
  return new URL(`${protocol}://${host}`);
}

export function generateMetadata(): Metadata {
  const metadataBase = getSiteUrl();
  const shareImage = new URL("/vibetime-og.png", metadataBase).toString();
  return {
    metadataBase,
    title: {
      default: SITE_TITLE,
      template: `%s · ${SITE_NAME}`,
    },
    description: SITE_DESCRIPTION,
    applicationName: SITE_NAME,
    keywords: ["영상 부업", "AI 영상", "숏폼 배포", "영상 판매", "부업", "VIBETIME"],
    formatDetection: { telephone: false },
    icons: {
      icon: [
        { url: "/images/vibetime-logo.png", type: "image/png", sizes: "1254x1254" },
        { url: "/favicon.svg", type: "image/svg+xml" },
      ],
      apple: [{ url: "/images/vibetime-logo.png", type: "image/png", sizes: "1254x1254" }],
      shortcut: "/favicon.svg",
    },
    alternates: { canonical: "/" },
    openGraph: {
      type: "website",
      siteName: SITE_NAME,
      title: SITE_TITLE,
      description: SITE_DESCRIPTION,
      locale: "ko_KR",
      url: "/",
      images: [{ url: shareImage, width: 1729, height: 910, alt: "VIBETIME 숏폼 영상 부업 플랫폼" }],
    },
    twitter: {
      card: "summary_large_image",
      title: SITE_TITLE,
      description: SITE_DESCRIPTION,
      images: [shareImage],
    },
    robots: {
      index: true,
      follow: true,
    },
  };
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#7c3aed",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
