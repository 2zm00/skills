import type { Metadata } from "next";
import { companyInfo } from "@/configs/companyInfo";
import { ogImageAlt, type PageMeta } from "@/configs/contents/seoContent";
import { ogImageUrl } from "@/configs/urls/imageUrl";

// page.tsx 공통 메타데이터. 제목은 키워드 순서를 지키기 위해 absolute(템플릿을 붙이지 않음).
export function buildMetadata(meta: PageMeta, type: "website" | "article" = "website"): Metadata {
  return {
    title: { absolute: meta.title },
    description: meta.description,
    // 페이지의 alternates가 layout 것을 통째로 덮으므로 RSS 링크도 여기서 다시 넣는다
    alternates: { canonical: meta.path, types: { "application/rss+xml": "/rss.xml" } },
    openGraph: {
      type,
      locale: "ko_KR",
      url: meta.path,
      siteName: companyInfo.alternateName || companyInfo.name,
      title: meta.title,
      description: meta.description,
      images: [{ url: ogImageUrl, width: 1200, height: 630, alt: ogImageAlt }],
    },
  };
}
