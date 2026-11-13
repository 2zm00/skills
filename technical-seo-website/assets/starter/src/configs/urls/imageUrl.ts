// 이미지·아이콘 경로는 이 파일에서만 관리한다. next/image에 넘길 width·height도 같이 둔다.

export const logoUrl = {
  symbol: "/images/logo.svg",
};

// 공유 미리보기 1200×630
export const ogImageUrl = "/images/og-image.png";

export const mainImageUrl = {
  hero: { src: "/images/main/hero.webp", width: 1440, height: 900 },
};

// 검색 화면 캡처는 WebP로 저장하고, 고객사 이름·주소·썸네일은 블러 처리한다.
export const proofImageUrl = {
  // naverExample: { src: "/images/proof/naver-example.webp", width: 1340, height: 1120 },
};
