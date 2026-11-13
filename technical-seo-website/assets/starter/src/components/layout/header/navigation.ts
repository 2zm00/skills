// 헤더·푸터 메뉴 이름과 링크는 이 파일에서만 관리한다. 지운 페이지는 여기서도 뺀다.

export interface NavigationLink {
  label: string;
  href: string;
  description?: string;
}

export interface NavigationGroup {
  label: string;
  href?: string;
  children?: NavigationLink[];
}

export const navigation: NavigationGroup[] = [
  {
    label: "서비스",
    children: [{ label: "서비스 이름", href: "/service", description: "한 줄 설명" }],
  },
  { label: "회사소개", href: "/about" },
];

export const headerCta: NavigationLink = { label: "무료 상담 신청", href: "/contact" };
