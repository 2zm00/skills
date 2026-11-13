# 예시컴퍼니 구현 지도 (example.com)

이 스킬의 기준 구현 예시다. 예시컴퍼니·example.com·계정명·ID·PR 번호는 모두 가상 값이다. 구조와 교훈만 가져다 쓰고, 값은 실제 프로젝트 것으로 바꾼다.

## 저장소·배포

- **코드**: 로컬 `<프로젝트 경로>`. Next.js 16 App Router, Tailwind v4, 글꼴 SUIT + Outfit.
- **GitHub** `example-org/example-site`
  - 저장소 주인 example-org이 머지하고, Vercel이 main을 배포한다.
  - 대표의 GitHub 계정은 push·PR 권한만 있고 Vercel 팀 멤버가 아니다(그 계정이 머지하면 배포가 막힌다). 그래서 브랜치 + PR만 올린다.
- **블로그**: `example.com/blog/`. 원본은 `blog.example.com`(워드프레스 + Rank Math)이고 `src/proxy.ts`로 프록시한다. 글은 블로그 글쓰기 스킬(예: `example-blog`)로 쓴다.

## 파일 지도

| 하는 일 | 파일 |
|---|---|
| 회사 정보, 소유 확인 값, GA ID, IndexNow 키 | `src/configs/companyInfo.tsx` |
| 페이지 메타(`pageMeta`), 조직·페이지 구조화 데이터 | `src/configs/contents/seoContent.ts` |
| 메타데이터 생성 (`title.absolute`, canonical, OG) | `src/utils/metadata.ts` |
| 페이지 문구 | `src/configs/contents/<page>Content.ts` |
| 사례 데이터와 상세 페이지 목록(`detailCases`) | `src/configs/contents/projectContent.ts` |
| 관련 링크 맵(`pickRelated`), 공통 문구, 팀 | `src/configs/contents/commonContent.ts` |
| 메뉴 | `src/components/layout/header/navigation.ts` |
| 사이트맵, robots | `src/app/sitemap.ts`, `src/app/robots.ts` |
| 리디렉션, 블로그 프록시 플래그, 이미지 형식 | `next.config.ts`, `src/proxy.ts` |
| GA4 | `src/components/layout/GoogleAnalytics.tsx` |
| 문의 폼 | `src/app/api/contact/route.ts`, `src/configs/urls/contactWebhook.ts`, `src/hooks/useContactForm.ts`, `src/utils/requestToSrv.tsx` |
| 검색 화면 캡처 | `public/images/proof/*.webp`, `src/configs/urls/imageUrl.ts`, `src/components/section/ProofCapture.tsx` |
| 소유 확인·IndexNow 파일 | `public/google….html`, `public/naver….html`, `public/<키>.txt` |
| IA 문서 | `docs/예시컴퍼니_IA_메타타이틀_v4.md` |

## 계정·ID (2026-10-27)

- **구글 서치콘솔**: URL 접두어 `https://example.com/`
  - 소유자: 대표의 구글 계정
  - 사용자(전체): 실무 담당자 2명의 구글 계정
- **GA4**: 계정 "예시컴퍼니"(<계정 ID>), 속성 <속성 ID> "example.com (홈페이지+블로그)", 측정 ID G-XXXXXXXXXX
  - 서치콘솔 연결 완료
  - 위 두 사용자는 편집자
- **네이버 서치어드바이저**: 대표의 네이버 계정. 사이트맵 2개, RSS, 수집 요청 13개.
- **빙 웹마스터**: 대표 구글 계정으로 로그인해 서치콘솔에서 가져옴.
- **문의 폼**: 대표 구글 계정 소유의 Google Apps Script가 대표의 Gmail과 네이버 메일 두 곳으로 보내고, 시트 "예시컴퍼니 홈페이지 진단 신청"에 백업한다. 키는 저장소 밖에 둔다.

## 결정과 교훈 (날짜순)

- **10/19 디자인**: 1·2차 디자인을 "AI가 만든 티"로 거절했다(보라 빛 번짐, 가운데 슬로건, 영문 머리말, 알약 태그, 둥근 카드, 등장 효과). 스위스·에디토리얼 방향으로 확정했다.
- **10/19~20 IA v2·v3**: 검색량·SERP로 3슬롯 제목을 정했다. GEO마케팅은 메인에서 `/geo`로 옮겨 겹침을 없앴다. `/consulting`은 `/seo`로 301 처리했다.
- **10/21 블로그**: 같은 도메인 프록시로 붙이고 Rank Math를 설정했다.
- **10/22 오픈**: GA4만 붙이고 열었다. 서치콘솔 등록이 빠져 5일간 색인이 0이었고, 10/27에 구글·네이버·빙을 한 번에 등록했다. 교훈: 소유 확인 방법은 GA와 함께 킥오프 때 정한다.
- **10/23 문의 폼**: `mailto:`에서 API 라우트 + Apps Script로 바꿨다(메일 두 곳 + 시트).
- **10/24 문구 검수**: 전 페이지 약 80곳을 고쳤다. 말이 안 되는 문장, 구어를 마케팅 용어로, 용어 통일, AI 말투.
  - PR #6을 직접 머지했다가 Vercel이 차단했다. 주인이 되돌리기를 두 번 해서 배포했다.
- **10/27 머지 규칙**: PR #10을 직접 머지했다. 사용자가 "절대 머지하지 마"라고 해서 main을 되돌리고 PR #11로 다시 올렸다. 이후 PR만 올린다.
- **10/27 30% 규칙**: 확정했다. 색인된 페이지의 큰 변경과 제목·H1·주소 변경은 먼저 묻는다.
- **10/27 마케팅 믹스·GBP**: 마케팅 믹스 제목을 채널 이름에서 전문 용어(IMC마케팅·통합마케팅)로 바꿨다. 구글 비즈니스 프로필 페이지는 삭제하고 `/marketing-mix`로 301 처리했다(PR #12, 10/27 16:41 주인이 머지).
- **10/29 문구 하드코딩 정리 (PR #13)**: 문구 검사로 TSX에 남은 문구 82개(aria-label, "출처:", 단위, 섹션 제목 포함)를 찾아 `uiContent.ts`와 페이지별 Content 파일로 옮겼다. "한 벌로"와 문의 폼의 옛 서비스명도 같이 고쳤다.
  - 검증: main과 브랜치를 각각 빌드해 20쪽의 화면 텍스트·aria-label·JSON-LD를 비교했다. 18쪽은 같았고, 다른 곳은 의도한 문구 2곳뿐이었다. 큰 리팩터링은 이 방식으로 "화면은 그대로"를 증명한다.
  - 외부 기여자 계정이 올린 PR은 Vercel 미리보기가 권한 문제로 실패한다. 주인이 머지하면 배포된다.
- **성능 점수 표기**: 다른 사이트 사례 점수(예: "모바일 63 → 100")는 측정일과 함께 쓴다.
