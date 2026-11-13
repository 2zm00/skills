import { companyInfo } from "@/configs/companyInfo";
import { logoUrl, ogImageUrl } from "@/configs/urls/imageUrl";

// 페이지별 메타 정보. 사이트맵(app/sitemap.ts)·메타데이터(utils/metadata.ts)·구조화 데이터가 모두 여기서 나온다.
// 제목은 docs/<브랜드>_IA_메타타이틀_vN.md 에서 검색량·SERP로 정한 값만 넣는다.
// 형식: "키워드 · 키워드 · 키워드 | 브랜드" (561px 이하, 한 키워드는 한 페이지만)
// 여기 넣은 경로는 사이트맵에 그대로 나간다. 실제 page.tsx가 있는 경로만 넣고, 페이지를 지우면 여기서 빼고 301을 건다.

export interface PageMeta {
  path: string;
  title: string;
  description: string;
  // 서비스·업종 페이지만: 구조화 데이터 Service 이름
  serviceName?: string;
  // 홈 다음부터의 위치 경로 (화면 브레드크럼 + BreadcrumbList)
  breadcrumb?: { name: string; path: string }[];
  // 본문을 실제로 고친 날 "YYYY-MM-DD". 사이트맵 lastmod·RSS pubDate·Article dateModified에 쓴다.
  // 빌드 날짜로 채우지 않는다(매번 바뀌는 lastmod는 구글이 무시한다). 모르면 비운다.
  updatedAt?: string;
  // 사례·글 상세만: 처음 공개한 날 "YYYY-MM-DD". 있으면 Article 구조화 데이터를 출력한다.
  publishedAt?: string;
}

// 절대 주소. 사이트맵·RSS·구조화 데이터가 같이 쓴다.
export const pageUrl = (path: string) => `${companyInfo.siteUrl}${path === "/" ? "" : path}`;

export const pageMeta = {
  main: {
    path: "/",
    title: "키워드1 · 키워드2 · 키워드3 | 브랜드명",
    description: "검색한 사람이 얻는 것 + 근거 한 가지. 1~2문장.",
  },
  service: {
    path: "/service",
    title: "서비스키워드 · 서비스키워드 · 서비스키워드 | 브랜드명",
    description: "서비스 설명 1~2문장.",
    serviceName: "서비스 이름",
    breadcrumb: [{ name: "서비스 이름", path: "/service" }],
  },
  contact: {
    path: "/contact",
    title: "무료 상담 신청 | 브랜드명",
    description: "문의 페이지 설명.",
    breadcrumb: [{ name: "무료 상담 신청", path: "/contact" }],
  },
} satisfies Record<string, PageMeta>;

// 사이트맵·RSS가 쓰는 전체 목록. 상세 페이지(사례·글)가 있으면 buildDetailMeta로 바꿔 이어 붙인다.
export const allPageMeta: PageMeta[] = [...Object.values(pageMeta)];

export const ogImageAlt = `${companyInfo.name}(${companyInfo.nameEn})`;

const sameAs = Object.values(companyInfo.sns).filter(Boolean);
const orgId = `${companyInfo.siteUrl}/#organization`;
const alternateName = [companyInfo.nameEn, companyInfo.alternateName].filter(Boolean);

// 루트 layout.tsx에서 한 번 출력하는 조직·웹사이트 구조화 데이터
export const organizationJsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      // 지역 매장·병원은 companyInfo.schemaType을 LocalBusiness·MedicalClinic 등 하위 타입으로 바꾼다
      "@type": companyInfo.schemaType,
      "@id": orgId,
      name: companyInfo.name,
      alternateName,
      url: companyInfo.siteUrl,
      logo: `${companyInfo.siteUrl}${logoUrl.symbol}`,
      image: `${companyInfo.siteUrl}${ogImageUrl}`,
      description: companyInfo.description,
      ...(companyInfo.email ? { email: companyInfo.email } : {}),
      ...(companyInfo.tel ? { telephone: companyInfo.tel } : {}),
      ...(companyInfo.address
        ? { address: { "@type": "PostalAddress", streetAddress: companyInfo.address, addressCountry: "KR" } }
        : {}),
      ...(companyInfo.ceo ? { founder: { "@type": "Person", name: companyInfo.ceo } } : {}),
      ...(sameAs.length > 0 ? { sameAs } : {}),
    },
    {
      "@type": "WebSite",
      "@id": `${companyInfo.siteUrl}/#website`,
      name: companyInfo.name,
      alternateName,
      url: companyInfo.siteUrl,
      inLanguage: "ko-KR",
      publisher: { "@id": orgId },
    },
  ],
};

interface FaqGroup {
  items: readonly { question: string; answer: string }[];
}

// 페이지별 구조화 데이터: Service + Article(상세) + BreadcrumbList + 화면에 있는 FAQ와 같은 문장의 FAQPage
export function buildPageJsonLd(meta: PageMeta, faq?: readonly FaqGroup[]) {
  const graph: Record<string, unknown>[] = [];

  if (meta.publishedAt) {
    graph.push({
      "@type": "Article",
      headline: meta.title,
      description: meta.description,
      url: pageUrl(meta.path),
      mainEntityOfPage: pageUrl(meta.path),
      image: `${companyInfo.siteUrl}${ogImageUrl}`,
      datePublished: meta.publishedAt,
      dateModified: meta.updatedAt ?? meta.publishedAt,
      author: { "@id": orgId },
      publisher: { "@id": orgId },
      inLanguage: "ko-KR",
    });
  }

  if (meta.serviceName) {
    graph.push({
      "@type": "Service",
      name: meta.serviceName,
      description: meta.description,
      url: `${companyInfo.siteUrl}${meta.path}`,
      provider: { "@id": orgId },
      areaServed: "KR",
    });
  }

  if (meta.breadcrumb) {
    graph.push({
      "@type": "BreadcrumbList",
      itemListElement: [{ name: "홈", path: "/" }, ...meta.breadcrumb].map((item, index) => ({
        "@type": "ListItem",
        position: index + 1,
        name: item.name,
        item: `${companyInfo.siteUrl}${item.path === "/" ? "" : item.path}`,
      })),
    });
  }

  if (faq && faq.length > 0) {
    graph.push({
      "@type": "FAQPage",
      url: `${companyInfo.siteUrl}${meta.path}`,
      mainEntity: faq.flatMap((group) =>
        group.items.map((item) => ({
          "@type": "Question",
          name: item.question,
          acceptedAnswer: { "@type": "Answer", text: item.answer },
        })),
      ),
    });
  }

  return { "@context": "https://schema.org", "@graph": graph };
}

// 사례·글 같은 상세 페이지 메타 (상세 데이터의 meta를 PageMeta로)
export function buildDetailMeta(
  base: { name: string; path: string },
  item: {
    slug: string;
    name: string;
    meta: { title: string; description: string; publishedAt?: string; updatedAt?: string };
  },
): PageMeta {
  const path = `${base.path}/${item.slug}`;
  return {
    path,
    title: item.meta.title,
    description: item.meta.description,
    publishedAt: item.meta.publishedAt,
    updatedAt: item.meta.updatedAt,
    breadcrumb: [base, { name: item.name, path }],
  };
}
