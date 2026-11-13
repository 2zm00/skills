import type { MetadataRoute } from "next";
import { allPageMeta, pageUrl } from "@/configs/contents/seoContent";

// allPageMeta에서 자동 생성한다. 페이지를 추가·삭제할 때 이 파일은 고치지 않는다.
// lastmod는 pageMeta.updatedAt이 있을 때만 넣는다(빌드 날짜를 넣으면 구글이 lastmod를 믿지 않는다).
export default function sitemap(): MetadataRoute.Sitemap {
  return allPageMeta.map((meta) => ({
    url: pageUrl(meta.path),
    ...(meta.updatedAt ? { lastModified: meta.updatedAt } : {}),
  }));
}
