// 회사·서비스 기본 정보. 헤더·푸터·메타데이터·구조화 데이터가 모두 이 파일을 참조한다.
// 빈 문자열("")인 항목은 화면과 구조화 데이터에서 자동으로 숨긴다. 푸터 정보는 절대 하드코딩하지 않는다.

export const companyInfo = {
  name: "브랜드명",
  nameEn: "Brand",
  // 브랜드명이 영화·제품 등과 겹치면 구분용 별칭 (예: "예시컴퍼니 마케팅")
  alternateName: "",
  description: "브랜드명은 ○○ 회사입니다. ○○과 ○○을 한 팀이 맡습니다.",
  // 조직 구조화 데이터 @type. 온라인 회사는 "Organization", 방문 매장은 "LocalBusiness",
  // 병원은 "MedicalClinic"처럼 schema.org 하위 타입을 쓴다(references/frontend-rules.md 구조화 데이터).
  schemaType: "Organization",

  siteUrl: "https://example.com",
  // 같은 도메인 블로그를 쓰면 "https://example.com/blog/" (references/blog-proxy.md)
  blogUrl: "",

  ceo: "",
  tel: "",
  email: "",
  businessNumber: "",
  address: "",

  // 검색엔진 소유 확인 (references/launch.md). public/ 아래 확인 파일도 같이 둔다. 지우면 확인이 풀린다.
  googleSiteVerification: "",
  naverSiteVerification: "",
  // IndexNow 키 (32자 hex). public/<키>.txt 내용과 같아야 한다.
  indexNowKey: "",
  // GA4 측정 ID. 비우면 태그를 넣지 않는다.
  gaMeasurementId: "",

  sns: {
    instagram: "",
    threads: "",
    youtube: "",
  },

  copyrightYear: 2026,
} as const;

export type CompanyInfo = typeof companyInfo;

export const telHref = `tel:${companyInfo.tel.replace(/-/g, "")}`;
export const mailHref = `mailto:${companyInfo.email}`;
