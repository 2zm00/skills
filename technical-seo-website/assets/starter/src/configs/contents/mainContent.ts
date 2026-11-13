import { mainImageUrl } from "@/configs/urls/imageUrl";

// 메인 페이지 문구. TSX에는 문구를 쓰지 않고 여기서 가져간다. (합니다체, references/copy-design.md)
export const mainContent = {
  hero: {
    // H1은 사람이 읽는 회사·서비스 이름(단답형). 메타타이틀(키워드 묶음)과 같을 필요는 없다.
    title: "회사·서비스 이름",
    titleMuted: "한 줄 설명. 슬로건 대신 무엇을 하는 회사인지.",
    description: "근거가 되는 사실 한두 가지. 2줄 이하.",
    primary: { label: "무료 상담 신청", href: "/contact" },
    image: mainImageUrl.hero,
  },
  proof: {
    label: "숫자로 보는 브랜드명",
    // 숫자는 출처·측정일과 함께. 지어낸 숫자·임시 수치 금지.
    items: [{ value: "0", label: "무엇의 숫자인지", source: "출처 · 2026년 10월" }],
  },
  faq: [
    {
      category: "비용·계약",
      items: [
        {
          question: "비용은 어떻게 정해지나요?",
          answer: "이유와 방법까지 2~3문장으로 답합니다. 화면 문장과 FAQPage 구조화 데이터 문장은 같아야 합니다.",
        },
      ],
    },
  ],
};
