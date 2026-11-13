// 여러 컴포넌트가 함께 쓰는 짧은 화면 문구·접근성 라벨·단위. (메뉴 이름·링크는 components/layout/header/navigation.ts)
// 클라이언트 컴포넌트도 import하므로 짧은 문자열만 둔다. 페이지 문구는 각 <page>Content.ts에 둔다.
export const uiText = {
  header: {
    navLabel: "주요 메뉴",
    mobileNavLabel: "모바일 메뉴",
    openMenu: "메뉴 열기",
    closeMenu: "메뉴 닫기",
  },
  footer: {
    company: "상호",
    ceo: "대표",
    businessNumber: "사업자등록번호",
    address: "주소",
  },
  faqTitle: "자주 묻는 질문",
};
