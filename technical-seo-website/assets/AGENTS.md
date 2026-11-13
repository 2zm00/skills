# 테크니컬 SEO 홈페이지 작업 규칙

> 이 파일 하나로 동작하는 작업 지시서다. 예시컴퍼니(example.com, 2026-10) 제작에서 확정한 규칙을 다른 프로젝트에 그대로 쓰도록 정리했다.
> - Claude Code·Codex: 프로젝트 루트에 `AGENTS.md`(또는 `CLAUDE.md`)로 둔다.
> - Cursor: `.cursor/rules/seo-website.md`로 둔다.
> - ChatGPT·Claude 앱: 첫 메시지에 붙여 넣고 "이 규칙으로 작업해"라고 쓴다.

## 0. 목표와 일하는 방식

- 목표: 크롤러가 모든 페이지를 읽고, 페이지마다 다른 검색어를 맡고, 런칭 당일부터 구글·네이버·빙에 등록된 홈페이지. SEO·AEO·GEO는 나중에 덧붙이지 않고 설계부터 넣는다.
- 순서: 입력 확인 → 키워드·IA → 개발 → 카피·디자인 → 출시 전 점검 → 런칭 등록 → 운영 중 수정.
- 비어 있는 값은 합리적인 기본값으로 먼저 진행하고, 가정한 것과 이유를 보고에 적는다. 정말 갈리는 결정만 묻는다.
- "완료"라고 말하기 전에 직접 확인한다(빌드, 실제 화면·응답, 수치의 출처). 측정값과 추정값을 나눠 보고한다.
- 답과 보고는 한국어로 한다. 사용자가 개발자가 아니면 용어 대신 클릭 경로와 쉬운 비유로 설명한다.

## 1. 시작 전에 받을 것

업체명, 업종, 서비스 목록, 지역·목표 시장, 경쟁사, 도메인, 블로그 여부, 로고·디자인 시스템, 사업자 정보(상호·대표·사업자등록번호·주소·연락처), 서치콘솔·GA·서치어드바이저를 만들 구글·네이버 계정. 고객 사이트는 고객 명의 계정으로 만들고 우리를 사용자로 추가한다.

## 2. 폴더 구조 (Next.js App Router + Tailwind CSS)

```
src/
  app/            page.tsx(메타데이터 + ServerContainer 호출만), layout.tsx, sitemap.ts, robots.ts, api/
  styles/         theme.css
  components/
    layout/       header/(Header.tsx 서버, HeaderClient.tsx 클라이언트, navigation.ts), footer/, DefaultLayout.tsx, GoogleAnalytics.tsx
    section/      여러 페이지가 함께 쓰는 섹션 (FAQ 목록, JSON-LD 출력 등)
    ui/           아코디언·버튼·캐러셀·모달·탭
  configs/
    contents/     페이지별 문구 (<page>Content.ts), seoContent.ts(pageMeta), uiContent.ts(여러 컴포넌트가 쓰는 짧은 문구)
    urls/         imageUrl.ts, apiUrl.ts, (서버 전용) contactWebhook.ts
    companyInfo.tsx
  container/
    Main/         MainServerContainer.tsx, MainClientContainer.tsx, MainServerBlock.tsx, MainClientBlock.tsx
  hooks/          커스텀 훅
  utils/          requestToSrv.tsx(서버·API 요청), metadata.ts
  lib/utils.ts    cn() (clsx + tailwind-merge)
```

## 3. 코드 규칙 (사용자 원문 규칙 요약)

**page**
- 페이지를 만들 때 메타데이터(`title.absolute`, `description`, `alternates.canonical`)를 같이 잡는다.
- `page.tsx`에서 UI나 기능을 만들지 않는다. 메타데이터와 `<XxxServerContainer />` 호출만 둔다.
- 루트 `layout.tsx`는 공통 Header로 시작해 `main`(헤더 높이만큼 위 여백) 다음 Footer로 끝난다. `<html lang="ko">`, 글꼴은 `next/font/local`(기본 Pretendard) 변수 클래스.

**styles**
- `theme.css`(Tailwind v4 `@theme`)를 반드시 둔다. 글꼴, 컬러 팔레트(primary, secondary)는 필수, radius·shadow·height(헤더 높이 모바일 60px / 데스크톱 80px)는 필요에 따라.

**components**
- 헤더는 서버(마크업·스타일)와 클라이언트(버튼·메뉴 열기 같은 상호작용)로 나눈다. 메뉴 이름은 하드코딩하지 않고 `header/navigation.ts`에서 관리한다.
- 푸터는 서버로 만들고, 외부 서비스로 이어지는 기능 버튼이 있을 때만 클라이언트 푸터를 더한다. 푸터 정보는 절대 하드코딩하지 않고 `configs/companyInfo.tsx`에서 가져온다.
- 여러 번 쓰는 섹션은 `components/section`, UI 요소는 `components/ui`에 만들고 블록 파일에서 import한다.
- `components/layout/DefaultLayout.tsx`를 항상 만든다(고정 헤더만큼 음수 여백 + `overflow-x-clip`).

**configs**
- 페이지 문구는 `configs/contents/<page>Content.ts`에 구조적으로 나눠 두고 import한다. TSX에 문구를 쓰지 않는다(aria-label, "출처:", 단위, 컴포넌트 기본값 포함). 이미지도 같은 객체에서 관리한다.
- 여러 컴포넌트가 함께 쓰는 짧은 문구는 `configs/contents/uiContent.ts`의 `uiText` 하나에 모은다. 클라이언트 컴포넌트도 import하므로 큰 객체(팀 소개·링크 맵 등)와 나눈다.
- 이미지·아이콘 경로는 `configs/urls/imageUrl.ts`, API 주소는 `configs/urls/apiUrl.ts` 변수로 둔다.

**container** (페이지마다 4파일)
- `ServerContainer`: 클라이언트 컨테이너가 서버 블록을 감싸는 구조. 데이터 요청은 `utils/requestToSrv`의 함수를 import해 여기서 한다.
- `ClientContainer`: 컨텍스트를 만들고 Values를 할당해 물려준다. `useEffect`를 남용하지 않는다. 다른 페이지에서도 쓰거나 반복되는 코드는 커스텀 훅으로 뺀다.
- `ServerBlock`: 최대한 SSR. `DefaultLayout` 안에 섹션 단위로 나열해, 누가 봐도 어떤 섹션으로 구성됐는지 보이게 한다. 클라이언트 요소는 ClientBlock에서 가져온다.
- `ClientBlock`: onClick·입력 같은 상호작용만. 없으면 `export {}`인 빈 파일. 컴포넌트로 해결되거나 단순 링크면 클라이언트 요소가 아니다.

```tsx
// app/seo/page.tsx
import SeoServerContainer from "@/container/Seo/SeoServerContainer";
import { pageMeta } from "@/configs/contents/seoContent";
import { buildMetadata } from "@/utils/metadata";
export const metadata = buildMetadata(pageMeta.seo);
export default function Seo() { return (<><SeoServerContainer /></>); }

// container/Seo/SeoServerContainer.tsx
import SeoClientContainer from "./SeoClientContainer";
import SeoServerBlock from "./SeoServerBlock";
export default function SeoServerContainer() {
  return (<SeoClientContainer><SeoServerBlock /></SeoClientContainer>);
}

// container/Seo/SeoClientContainer.tsx
"use client";
import { createContext, ReactNode } from "react";
interface SeoContextProps {}
export const SeoContext = createContext({} as SeoContextProps);
export default function SeoClientContainer({ children }: { children: ReactNode }) {
  const SeoContextValues = {};
  return <SeoContext value={SeoContextValues}>{children}</SeoContext>;
}
```

**hooks·utils**
- 반복·공통 기능은 커스텀 훅. 한 파일에 훅 하나가 원칙이고, 연관이 분명할 때만 묶는다.
- `requestToSrv.tsx`는 서버·API 요청이 있을 때만 만든다. 타입을 명시하고 `any`를 쓰지 않는다. 요청 주소는 변수로 관리한다.

## 4. SEO 코드 규칙

**메타데이터는 한 곳에서**
- `configs/contents/seoContent.ts`의 `pageMeta`에 페이지마다 `path`, `title`, `description`, `serviceName`(서비스·업종 페이지), `breadcrumb`을 둔다.
- `utils/metadata.ts`의 `buildMetadata(meta)`가 `title.absolute`(템플릿을 붙이지 않아 키워드 순서 유지), `alternates.canonical`, Open Graph를 만든다.
- 루트 `layout.tsx`: `metadataBase`, `title.template`, 기본 OG 이미지 1200×630, `<head>`에 `google-site-verification`·`naver-site-verification` 메타(값은 `companyInfo`), 조직 구조화 데이터.
- 상세 페이지(사례·글)는 `generateStaticParams` + `dynamicParams = false` + `generateMetadata`. 목록에만 있고 상세가 없는 항목은 링크를 걸지 않는다.

**사이트맵·robots·리디렉션**
- `app/sitemap.ts`는 `pageMeta`와 상세 배열에서 자동 생성한다. 페이지를 추가하면 `pageMeta`에만 넣는다. `lastmod`는 실제 수정일(`updatedAt`)만, 빌드 날짜는 넣지 않는다. 200·자기 canonical·색인 허용 주소만 넣는다.
- `app/llms.txt/route.ts`: 같은 목록으로 `/llms.txt`(llmstxt.org 형식: 브랜드·설명·페이지 목록·연락처)를 만든다. robots.txt에서 AI 크롤러를 막지 않는다.
- `app/rss.xml/route.ts`: 같은 목록으로 RSS 2.0 피드(`/rss.xml`)를 만들고 `<head>`에 `rel="alternate" type="application/rss+xml"` 링크를 둔다. 네이버 서치어드바이저에 제출한다(블로그가 있으면 블로그 피드).
- `app/robots.ts`: 전체 허용 + 사이트맵 주소(블로그가 있으면 블로그 사이트맵도).
- 없어진 주소는 `next.config.ts`의 `redirects()`에 `permanent: true`. 이미 색인 요청한 주소를 404로 두지 않는다.

**구조화 데이터 (JSON-LD)**
- `layout.tsx`: `Organization`(`@type`은 `companyInfo.schemaType`: 매장 `LocalBusiness`, 병원 `MedicalClinic` 등. `address`·`telephone`은 값이 있을 때만. `@id: <사이트>/#organization`, `alternateName`, `logo`, `sameAs`, `founder`, `knowsAbout`) + `WebSite`(`publisher`로 조직 연결). 브랜드명이 다른 것(영화·제품)과 겹치면 `alternateName`에 "브랜드 마케팅"처럼 구분 이름을 둔다.
- 페이지마다 `Service`(provider로 조직 연결) + `Article`(사례·글 상세, `datePublished`·`dateModified`) + `BreadcrumbList` + 화면 FAQ와 같은 문장의 `FAQPage`. 화면에 없는 질문은 넣지 않는다. 병원은 `MedicalClinic`·`Physician`·`OpeningHoursSpecification`을 `@id`로 잇는다.
- 스키마 값은 화면 내용과 같게. 화면에 없는 별점·가격·후기는 넣지 않는다. 배포 전 리치 결과 테스트와 validator.schema.org로 확인한다.

**크롤러가 읽는 마크업**
- 모든 페이지는 서버에서 그린다. 클라이언트 컴포넌트는 상호작용 부분만.
- 페이지당 H1 하나. 섹션은 `aria-labelledby`로 소제목과 묶는다. 브레드크럼을 화면에도 보여 준다.
- FAQ 탭·아코디언은 모든 질문과 답을 DOM에 둔다(비활성 탭은 `hidden`). 클릭할 때 불러오지 않는다.
- 페이지 아래 "함께 보면 좋은 페이지"로 관련 페이지를 잇는다. 지운 페이지는 링크 맵에서도 뺀다.
- 이미지는 `next/image` + `width`·`height`, `images.formats: ["image/avif", "image/webp"]`. 교체한 이미지가 캐시로 안 바뀌면 파일 이름을 바꾼다.

**GA4·속도**
- GA4는 운영 빌드에서만, `gtag.js`는 `next/script`의 `lazyOnload`. 이 방식이면 서치콘솔 "GA로 소유 확인"이 실패하므로 소유 확인은 메타 태그 + HTML 파일로 한다.
- 움직임은 CSS 스크롤 기반으로, `@supports`와 `prefers-reduced-motion`으로 감싼다. 모든 섹션에 등장 효과를 넣지 않는다.
- Tailwind v4 글자 크기 토큰(`text-body-1` 등)은 `extendTailwindMerge`에 font-size 그룹으로 등록한다. 안 하면 `text-white` 같은 색상 클래스가 지워진다.
- 출시 전 PageSpeed 모바일·데스크톱을 재고 날짜와 함께 기록한다. 화면에 점수를 쓰면 측정일을 붙인다.

**문의 폼**
- `mailto:`로 만들지 않는다(신청자가 메일 앱에서 안 보내면 유실). `app/api/contact/route.ts`가 받아 외부 수신처(Google Apps Script 웹 앱: 메일 여러 곳 + 구글 시트 백업)로 넘긴다.
- 라우트에서 필수값을 확인하고, 봇용 숨김 칸(`website`)이 채워지면 성공처럼 응답하고 버린다.
- 수신 주소·키는 서버 전용 파일 + 환경변수(`CONTACT_WEBHOOK_URL`, `CONTACT_WEBHOOK_SECRET`). 빌드 후 `.next/static`에 키가 없는지 grep으로 확인한다.
- 화면 상태는 보내는 중 / 접수 완료 / 실패(전화·메일 안내).

## 5. 키워드·IA·메타타이틀

- 브랜드는 역량 중심으로 세우고 업종은 입구 페이지로 둔다. 페이지 역할: 메인(회사 정체성 + 업체 찾기), 서비스마다 한 페이지, 업종 입구, 사례·회사소개·문의, 블로그(정보형 키워드).
- 운영하지 않을 서비스는 "검색 입구용"으로도 페이지를 만들지 않는다.
- 페이지당 후보 10~25개(서비스명, +업체·대행사·컨설팅·제작·비용, 업종+서비스, 지역+서비스, 동의어, 띄어쓰기 변형)를 만들고 네이버(PC+모바일 합계)·구글(한국) 월 검색량을 같은 날 잰다. 네이버 0은 "10 미만"으로 적고, 숫자 옆에 측정일을 적는다.
- SERP를 둘 다 본다. 네이버는 블록 순서와 웹사이트 블록 속 민간 사이트(업체·대행사) 유무, 구글은 상위 10개 도메인 유형과 AI 개요 유무. 한국 결과는 한국 IP 실제 브라우저로 본다.

| 상황 | 판단 |
|---|---|
| 네이버 3,000 이하 + 웹사이트 블록·웹문서 상위에 민간 사이트 | 제목 슬롯. 제목만으로 진입 가능 |
| 3,000 초과지만 웹사이트 블록에 업체가 들어옴 | 제목에 넣고 "3천↑ 본문 보강" 표시, 허브·비교표·FAQ 본문을 같이 만든다 |
| 웹사이트 블록 없음(블로그·위키·언론·교육기관만) | 제목에서 뺀다 |
| 동음이의·다른 의도, 공공·플랫폼 독점 | 뺀다 |
| 아주 작지만 웹사이트 블록에 업체가 보임 | 보조 슬롯 가능("소량" 표시) |
| 검색량 목적이 아닌 페이지(회사소개·문의) | 브랜드·전환 문구만 |

**메타타이틀**
- 형식은 `포커스 · 키워드2 · 키워드3 | 브랜드`. 폭은 561px 이하(한글 약 16.6px, 영문 소문자 약 9.4px로 어림).
- 3슬롯 중 하나 이상은 3,000 이하 진입 가능 슬롯. 한 키워드는 한 페이지만 맡는다. 긴 키워드가 짧은 키워드를 품으면 짧은 것은 따로 넣지 않는다.
- 채널·도구 이름(인플루언서마케팅 등)보다 전략 용어(IMC마케팅·통합마케팅 등). 서술형·후킹 문구("~하는 법", "총정리", "완벽 가이드", "No.1") 금지. 의료는 최상급 금지.
- H1은 사람이 읽는 서비스 이름(단답형) + 바로 아래 한 줄 설명. 제목과 같을 필요가 없다.
- 메타 설명은 검색한 사람이 얻는 것 + 근거 한 가지를 1~2문장(한글 80~150자). 제목 키워드 1~2개를 자연스럽게 넣는다.

**IA 문서**: `docs/<브랜드>_IA_메타타이틀_vN.md`. 버전마다 새 파일. 머리(기준·측정일·도구·이전 대비 바뀐 점) → 메뉴 구조 → 페이지 표(경로 | H1 | 메타타이틀 | 키워드별 N/G·3천↑·SERP 메모) → 상세 표 → 변경 기록 → 제외 키워드와 이유 → 운영 규칙. 사용자 확인 후 개발한다.

## 6. 카피

- 사이트 전체를 합니다체로 쓴다. 구어(해요체)는 따옴표 안 고객 대사에만. 안내 문구의 "입력해 주세요"는 괜찮다.
- 첫 화면은 슬로건이 아니라 증거와 전문성으로 시작한다. H1 아래 설명은 2줄 이하. 섹션 제목은 결론을 말하는 한 문장(데이터 이름표 금지).

| 쓰지 않는다 | 대신 |
|---|---|
| ~같이 돕니다, ~해 드립니다 남발 | ~합니다, 맡습니다 |
| 혁신적인, 완벽한, 최고의 | 구체 숫자·범위 |
| 단순히 ~가 아니라 ~이다, ~하는 순간 | 바로 결론 |
| ~에 대한, ~역할을 합니다, ~을 통해 | ~를 묻는, ~가 됩니다, ~로 |
| 효율적으로, 체계적으로, 전략적으로 | 무엇이 얼마나 줄었는지 |
| 한 문장에 "할 수 있습니다" 여러 번 | 한 번만, 나머지는 단정 |
| 습관적인 세 항목 나열 | 실제 개수대로 |
| 줄표(—)·굵은 글씨 남발 | 쉼표·문장 분리 |
| PROBLEM, STEP 01 같은 영문 대문자 머리말 | 한국어 짧은 라벨 |
| "노출도 0" | 제로 |
| 손님이 오는 길 / 먼저 하는·받쳐 주는 채널 / 어디서 새는지 / 한 벌로 | 고객 여정 / 핵심·서포트 채널 / 이탈 지점 / 하나로 통일 |

- 서비스 하나에는 이름 하나. 메뉴·H1·메타·관련 링크·문의 폼 선택지·푸터·구조화 데이터 `serviceName`까지 같게. 고칠 때마다 앞뒤 모순(비판한 것을 우리가 하는 문장, 페이지마다 다른 숫자 기준)을 다시 본다.
- FAQ: 계약 전 실제 질문(비용, 순위 보장, 최소 계약 기간, 계약 후 소유권, 효과 시점, AI로 글을 쓰는지, 기존 대행사와 병행, 업종별 차이). 답은 이유와 방법까지 2~3문장. 분류 탭으로 나누고 같은 문장을 `FAQPage`에.
- 숫자: 출처와 측정일을 붙인다. 실측과 추정을 나누고, 계산기의 가정값은 화면에 적는다. 지어낸 후기·통계 금지. 임시 수치는 "임시 수치"로 표시하고 공개 전에 지운다(표시광고법). 사용자가 정한 숫자는 근거를 확인할 때까지 그대로 둔다.
- 고객사: 서면 동의 전까지 업종·지역으로만(예: "안양 내과의원"). 검색 화면 캡처는 이름·주소·썸네일·다른 사람 이름을 블러로 가리고, 엔진 배지와 날짜가 든 설명을 단다. 설명에는 화면에 실제로 보이는 것만 쓴다.
- 경쟁사 비교는 특정 회사가 떠오르지 않게 "흔히 보는 대행사 vs 우리".
- 병원: 최상급 표현, 치료 경험담, 전후 사진 금지. 심의 대상 매체를 확인한다.

## 7. 디자인

- 쓰지 않는다("AI가 만든 티"): 어두운 배경의 보라 빛 번짐·그라데이션·격자 배경, 가운데 정렬 큰 슬로건, 한 단어만 색 바꾼 헤드라인, 영문 대문자 머리말, 체크 알약 태그, 모든 카드 둥근 모서리, STEP 카드, 같은 모양 3칸 카드 반복, 모든 섹션 등장 효과, 순서 없는 내용의 01/02/03.
- 쓴다(스위스·에디토리얼): 종이색·흰 배경, 거의 검정인 글자, 1px 구분선, 각진 모서리, 왼쪽 정렬. 강조색은 하나만 아껴서(CTA 점, 숫자 강조, 페이지당 한 번의 전폭 띠). 서비스 페이지마다 구성을 다르게(리포트형·대화형·잡지형·사양서형). 카드 안에는 실제 데이터·화면, 설명은 카드 밖. 가치를 보여 주는 상호작용(검색 노출 시뮬레이터, 광고비 절감 계산기, 전후 비교)은 환영하되 내용은 서버에서 그린다.

## 8. 출시 전 점검

1. `tsc --noEmit`, `next build` 통과. 라우트를 지운 뒤 타입 오류가 나면 `.next`를 지우고 다시 빌드한다.
2. 로컬에서 사이트맵의 모든 주소가 200, 페이지마다 제목 561px 이하·H1 1개·메타 설명·canonical(자기 주소)·구조화 데이터가 있고 제목 키워드가 페이지끼리 겹치지 않는다.
3. TSX에 문구가 없고, 스타터 자리표시("브랜드명", "키워드1", `example.com`)가 남지 않았다.
4. 지운 주소는 301·308, 지운 주소로 가는 내부 링크 0개, 사이트맵 개수가 IA 문서와 같다.
5. 문의 폼: 필수값·숨김 칸 확인, 실제 접수 메일과 시트 기록 확인, 클라이언트 번들에 키 없음.
6. PageSpeed 모바일·데스크톱 측정(날짜 기록).

## 9. 런칭 당일 등록 (GA만 붙이고 끝내지 않는다)

1. **구글 서치콘솔**: URL 접두어 속성 → HTML 파일 + 메타 태그를 둘 다 배포 → 소유 확인 → 사이트맵 제출(홈페이지 + 블로그) → URL 검사로 색인 요청(하루 10~12개 한도: 홈 → 핵심 서비스 → 업종 → 대표 글·사례) → 사용자 추가(권한 "전체").
2. **GA4**: 시간대 한국·통화 원·보관 14개월. 서치콘솔 연결(관리 → 제품 링크). 블로그도 같은 측정 ID. 주요 이벤트(문의 접수 완료·전화·카카오톡 클릭)는 CTA가 확정되면 `gtag('event')`로 붙이고 주요 이벤트로 표시한다.
3. **네이버 서치어드바이저**: 사이트 등록 → HTML 파일 + 메타 태그로 소유 확인 → 사이트맵 제출 → RSS 제출(블로그 피드, 블로그가 없으면 `/rss.xml`) → 웹 페이지 수집 요청(주요 주소).
4. **빙 웹마스터**: 서치콘솔에서 가져오기(사이트맵도 같이 들어온다).
5. **IndexNow**: 32자 키 파일을 `public/<키>.txt`로 배포하고 사이트맵 주소 전체를 `api.indexnow.org`, `www.bing.com/indexnow`, `searchadvisor.naver.com/indexnow`에 POST(`{host, key, keyLocation, urlList}`). 200·202가 정상.
6. 확인: robots.txt 200·전체 허용·사이트맵 표기, http → https와 www → 루트 영구 이동, 없는 주소 404, 소유 확인 파일 200.
7. 3~4일 뒤 `site:도메인`을 구글·네이버·빙에서 보고, 서치콘솔 색인 현황·서치어드바이저 수집 현황·GA 유입을 보고한다.

## 10. 운영 중 수정

- 색인된 페이지에서 한 페이지 30% 이상 바꾸거나 제목·H1·주소·canonical을 바꿀 때는 적용 전에 멈추고 보고한다: 페이지, 변경 비율(페이지 단위), 바뀌는 것, 두 번에 나누는 작은 대안. 승인 후 적용한다.
- 제목을 바꾸면 새 키워드를 첫 화면 설명·메타 설명·FAQ 중 한두 곳에도 넣는다. 같은 날 IA 문서에 이전 → 변경, 이유, 검색량(측정일)을 적는다.
- 페이지를 지울 때 404로 두지 않는다. 가장 가까운 페이지로 301, 사이트맵·내부 링크·관련 링크·폼 선택지·IA 문서까지 정리한다.
- 배포 후 서치콘솔 색인 재요청 + IndexNow 제출.

## 11. 저장소·보안

- 팀 저장소는 새 브랜치 + PR만 올린다. 주제별로 PR을 나누고 본문에 바뀐 것·확인한 것을 적는다. 사용자가 "머지해"라고 해도 머지하지 않고 저장소 주인에게 넘긴다(배포 권한이 저장소 주인 쪽에 있다).
- 토큰·폼 키·비밀번호는 저장소·문서·채팅에 쓰지 않는다. 서버 전용 파일 + 환경변수.
- 지우기·301·색인된 주소 변경처럼 되돌리기 어려운 일은 먼저 묻는다.
