import type { Metadata } from "next";
import "./globals.css";
import { cn } from "@/lib/utils";
import Header from "@/components/layout/header/Header";
import Footer from "@/components/layout/footer/Footer";
import GoogleAnalytics from "@/components/layout/GoogleAnalytics";
import { companyInfo } from "@/configs/companyInfo";
import { ogImageAlt, organizationJsonLd } from "@/configs/contents/seoContent";
import { ogImageUrl } from "@/configs/urls/imageUrl";
import { pretendard } from "./font";

export const metadata: Metadata = {
  metadataBase: new URL(companyInfo.siteUrl),
  title: {
    template: `%s | ${companyInfo.name}`,
    default: companyInfo.name,
  },
  description: companyInfo.description,
  alternates: {
    canonical: "/",
    types: { "application/rss+xml": "/rss.xml" },
  },
  openGraph: {
    type: "website",
    locale: "ko_KR",
    url: "/",
    siteName: companyInfo.alternateName || companyInfo.name,
    images: [{ url: ogImageUrl, width: 1200, height: 630, alt: ogImageAlt }],
  },
  twitter: {
    card: "summary_large_image",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className={cn(pretendard.variable)}>
      <head>
        {/* 검색엔진 소유 확인: 값은 companyInfo, 같은 이름의 HTML 파일도 public/에 둔다 */}
        {companyInfo.googleSiteVerification && (
          <meta name="google-site-verification" content={companyInfo.googleSiteVerification} />
        )}
        {companyInfo.naverSiteVerification && (
          <meta name="naver-site-verification" content={companyInfo.naverSiteVerification} />
        )}
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }} />
      </head>
      <body className={cn("min-h-screen flex flex-col font-sans")}>
        <GoogleAnalytics />
        <Header />
        <main className="flex-1 pt-(--header-height-mobile) md:pt-(--header-height-desktop)">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
