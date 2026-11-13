import type { MetadataRoute } from "next";
import { companyInfo } from "@/configs/companyInfo";

export default function robots(): MetadataRoute.Robots {
  const sitemap = [`${companyInfo.siteUrl}/sitemap.xml`];
  // 같은 도메인 블로그(워드프레스 Rank Math)는 사이트맵을 따로 만든다
  if (companyInfo.blogUrl) sitemap.push(`${companyInfo.blogUrl}sitemap_index.xml`);
  return {
    rules: [{ userAgent: "*", allow: "/" }],
    sitemap,
  };
}
