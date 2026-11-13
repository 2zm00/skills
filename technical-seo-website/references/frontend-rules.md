# 프론트엔드 코드 규칙

1부는 사용자가 준 규칙 원문(2026-10-13, Next.js 외주 공통)이다. 고치지 않고 그대로 따른다. 2부는 예시컴퍼니(example.com)를 만들며 SEO 때문에 더한 규칙이다.

---

## 1부. 사용자 규칙 원문



### 프론트 개발 구조

Next.js 사양 기준으로 다음과 같은 디렉토리 구조로 상태를 나눠 관리한다.

1. page
2. styles
    1. theme.css
3. components
    1. layout
    2. section
    3. ui
4. configs
    1. contents
    2. urls
5. container
    1. Main
        1. MainClientBlock.tsx
        2. MainClientContainer.tsx
        3. MainServerBlock.tsx
        4. MainServerContainer.tsx
6. hooks
7. utils

## page 관리

### 규칙

1. 메타데이터는 페이지 생성과 동시에 예시과 같이 구조를 잡는다.
2. page.tsx에서 바로 웹의 ui 요소나 기능을 구현하지 않는다.
3. 기존 app 디렉터리의 layout.tsx는 예시 (2)를 참고한다. 크게 공통 Header로 화면이 시작해서 Foote로 마무리되는 공통 구조를 갖도록 설계한다.

### 예시 (1)

```tsx
import type { Metadata } from "next";
import MainServerContainer from "@/container/Main/MainServerContainer";

export const metadata: Metadata = {
  title: {
    absolute: "메타 title 예시",
  },
  description:
    "메타 description 예시",
  alternates: {
    canonical: "/",
  },
};

export default function Main() {
  return (
    <>
      <MainServerContainer />
    </>
  );
}

```

### 예시(2)

```tsx
import type { Metadata } from "next";
import "./globals.css";
import { cn } from "@/lib/utils";
import Header from "@/components/layout/header/Header";
import Footer from "@/components/layout/footer/Footer";
import QuickMenu from "@/components/layout/quick-menu/QuickMenu";
import { pretendard } from "./font";

export const metadata: Metadata = {
  metadataBase: new URL("https://예시주소"),
  title: {
    template: "%s | 서비스명",
    default: "서비스명",
  },
  description: "",
  alternates: {
    canonical: "/",
  },

  openGraph: {
    type: "website",
    locale: "ko_KR",
    url: "/",
    siteName: "",
    images: [
      {
        url: "",
        width: 1200,
        height: 630,
        alt: "",
      },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className={cn(pretendard.variable)}>
      <head>
        <meta
          name="naver-site-verification"
          content="<네이버 소유 확인 값>"
        />
      </head>
      <body className={cn("min-h-screen flex flex-col font-sans")}>
        <Header />
        <main className="pt-(--header-height-mobile) md:pt-(--header-height-desktop)">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}

```

## styles

스타일을 지정한 테마 파일을 필수로 갖고 tailwind css 기반으로 스타일링을 적용하도록 한다.

### theme.css

#### 규칙

각 들어가야할 스타일링 요소는 폰트, 컬러 팔레트(primary, secondary) 이며 필요에 따라 radius, shadow, height를 지정한다.

#### 예시

```css
@theme {
  /* Font Family */

  --font-sans: var(--font-pretendard), sans-serif;

  /* Primary */
  --color-primary-50: #f5f9fc;
  --color-primary-100: #e9f1f8;
  --color-primary-200: #d5e3f0;
  --color-primary-300: #b8cee3;
  --color-primary-400: #8eb0d0;
  --color-primary-500: #5e89b2;
  --color-primary-600: #3d6793;
  --color-primary-700: #234d78;
  --color-primary-800: #1d4065;
  --color-primary-900: #173453;

  /* Secondary */

  --color-secondary-50: #f7f5f3;
  --color-secondary-100: #f0ede9;
  --color-secondary-200: #ede8e2;
  --color-secondary-300: #e2dcd3;
  --color-secondary-400: #d9d1c7;
  --color-secondary-500: #cbbfb2;
  --color-secondary-600: #b7aa9c;
  --color-secondary-700: #9a8876;
  --color-secondary-800: #786c62;
  --color-secondary-900: #5a5047;

  /* Gray */

  --color-gray-50: #fafafb;
  --color-gray-100: #f3f4f6;
  --color-gray-200: #e5e7eb;
  --color-gray-300: #d1d5db;
  --color-gray-400: #9ca3af;
  --color-gray-500: #6b7280;
  --color-gray-600: #4b5563;
  --color-gray-700: #374151;
  --color-gray-800: #1f2937;
  --color-gray-900: #111827;

  /* Static */

  --color-white: #ffffff;
  --color-black: #000000;

  /* Semantic */

  /* Radius */

  --radius-sm: 0.5rem; /* 8px */
  --radius-md: 0.75rem; /* 12px */
  --radius-lg: 1rem; /* 16px */
  --radius-xl: 1.5rem; /* 24px */

  /* Shadow */

  --shadow-sm: 0 2px 8px rgb(0 0 0 / 0.04);
  --shadow-md: 0 8px 24px rgb(0 0 0 / 0.08);
  --shadow-lg: 0 16px 40px rgb(0 0 0 / 0.12);

  /* height */
  --header-height-mobile: 60px;
  --header-height-desktop: 80px;
}

```

## Components

### layout

layout은 크게 2개의 디렉토리를 갖는다. Header, Footer

#### header

SSR을 위해 client, server를 나눠 구현한다. 

#### header 규칙

1. server header에서는 ui 상 보여지는 헤더를 위한 마크업 및 스타일링을 구현 담당한다.
2. client header에서는 버튼 클릭과 관련된 기능 구현, 인터랙션을 담당한다.
3. 헤더에 들어가는 메뉴의 이름은 하드코딩하지 않는다. header 디렉터리 안에서 navigation.ts를 생성하여 해당 파일에서 메뉴의 이름을 생성 및 수정, 관리하고 이를 헤더 구현시 import 한다.

### footer

SSR을 위해 client, server를 나눠 구현한다.

1. server footer에서는 ui상 보여지는 헤더를 위한 마크업 및 스타일링을 구현 담당한다.
2. client footer는 footer에서 외부 서비스로 이어지는 링크나 버튼이 있는 경우 구현하며 별도의 기능 구현이 없는 경우 server footer만 생성한다.
3. 푸터에 들어가는 정보들은 절대로 하드코딩 하지 않는다. configs 디렉토리에서 별도의 서비스 정보를 위한 companyInfo.tsx를 생성하를 이를 import하여 보여준다. 

### section

공통되게 사용되는 섹션은 컴포넌트 요소로 생성하도록 한다.

### ui

아코디언, 버튼, 캐러셀, 모달, 탭 ui 등 ui 요소는 재사용성을 위해 다음에서 만든후 block 파일에서 import 하여 사용한다.

### Default Layout

늘 DefaultLayout.tsx를 components/layout 디렉토리 아래에 생성, 다음과 같이 작성한다.

```tsx
interface LayoutProps {
  children: React.ReactNode;
}

export default function DefaultLayout({ children }: LayoutProps) {
  return (
    <div className="relative -mt-(--header-height-mobile) md:-mt-(--header-height-desktop) w-full overflow-x-clip">
      {children}
    </div>
  );
}

```

## configs

### contents

각 페이지별 들어가는 텍스트 내용을 구조적으로 나눠 관리할 수 있도록 작성한다. 해당 내용을 요하는 페이지에서 import 하여 텍스트를 가져올 것. 이미지도 같이 관리하는 방향을 검토해라.

```tsx
export const mainContent = {
  section1: {
    text1: ["", ""],
    description: "",

    image: mainImageUrl.image1,
  },
```

### urls

image, icon 요소 등의 image url을 관리하는 파일로 사용한다.

#### 예시

```tsx
export const logoUrl = "/images/logo.svg";

export const quickMenuIconUrl = {
  naverBooking: "/icons/naver-booking-icon.svg",
  kakaoChat: "/icons/kakao-icon.svg",
  tel: "/icons/tel-icon.svg",
};
```

## container

### container Name(e.g. Main)

각 페이지별 컨테이너를 생성, 컨테이너에는 4개의 상태관리 파일을 생성하여 이에 맞게 구조적으로 작성하고 페이지를 구성한다. 크게 Client, Server단으로 나눠 각각 UI 요소를 관리하고 구현하는 Block파일, 기능 구현과 데이터 fetch 등을 담당하는 Container파일로 분리한다.

#### ClientBlock(e.g. MainClientBlock.tsx)

1. 클라이언트 요소(버튼 기능 붙여야 하는 onClick,  인터랙션) 등을 구현한다.
2. 별도의 클라이언트 요소가 없을땐 빈 파일로 작성해도 된다. (컴포넌트로 해결이 되거나 단순 링크 기능인 경우는 클라이언트 요소가 아니다.)

#### ClientBlock(e.g. MainClientContainer.tsx)

예시 코드와 같은 틀로 기본값을 가져야 한다. 컨텍스트를 생성하고, 필요한 값은 해당 생성 컨텍스트 Values를 생성하여 할당하고 이를 컨텍스트에 물려주도록한다. 

#### 규칙

1. use Effect를 과도하게 사용하지 않고 필요한 경우에 사용하도록 한다.
2. 타 페이지에 사용되거나 반복 구현해야 하는 코드의 경우 해당 컨테이너에서 function을 구현하지 않고 커스텀 훅으로 처리하여 import 할 것.

#### 예시

```tsx
"use client";

import { createContext, ReactNode } from "react";

interface MainContextProps {}

export const MainContext = createContext({} as MainContextProps);

export default function MainClientContainer({
  children,
}: {
  children: ReactNode;
}) {
  const MainContextValues = {};
  return <MainContext value={MainContextValues}>{children}</MainContext>;
}

```

#### ClientBlock(e.g. MainServerBlock.tsx)

#### 규칙

1. 최대한 SSR로 구현할 수 있도록 할 것.
2. 기본 레이아웃은 DefaultLayout 으로 둘러싸인 안에 섹션 단위별로 나눠 구현하고 이를 넣어 타인이 보더라도 MainServerBlock이 어떤 섹션으록 구성되어있는지 명확히 눈으로 확인할 수 있게 할 것.
3. 클라이언트 사이드 렌더링 요소가 필요한 경우 Client Block에서 불러오고 이를 사용하도록 한다. 

#### 예시

```tsx
import Image from "next/image";
import DefaultLayout from "@/components/layout/DefaultLayout";

export default function MainServerBlock() {
  return (
    <DefaultLayout>
      <Section1 />
      <Section2 />
    </DefaultLayout>
  );
}
```

#### ClientBlock(e.g. MainServerContainer.tsx)

#### 규칙

1. 늘 해당 클라이언트 컨테이너가 서버 블록을 랩핑하는 구조를 가져라.
2. 데이터 fetch가 필요한 경우 (api 요청 등) 이 파일 내에서 요청하는 서버 요청 function 을 import 하여 작성하도록 한다. 서버 요청 function은

#### 예시

```tsx
import MainClientContainer from "./MainClientContainer";
import MainServerBlock from "./MainServerBlock";

export default function MainServerContainer() {
  return (
    <MainClientContainer>
      <MainServerBlock />
    </MainClientContainer>
  );
}

```

## hooks

### 규칙

1. 클라이언트 컨테이너 내에서 반복적으로 구현할 필요가 있거나 공통된 기능이라고 판단되는 경우 커스텀 훅으로 빼내어 import하면 사용 가능하도록 구조적으로 관리해야 한다.
2. 되도록 하나의 커스텀 훅 파일에는 하나의 훅만 구현하지만 예외로 그룹핑이 가능한 경우 여러개의 커스텀 훅을 하나의 파일이 가지고 있음을 허용한다. 단, 연관성이 있고 그룹이 되어야 함이 타당해야만 한다.

### 예시

```tsx
"use client";

import { useCallback, useEffect, useState } from "react";

export function useAutoCarousel(itemCount: number, intervalMs = 4000) {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % itemCount);
    }, intervalMs);

    return () => clearInterval(timer);
  }, [itemCount, intervalMs]);

  const goTo = useCallback((index: number) => {
    setCurrent(index);
  }, []);

  return { current, goTo };
}

```

## Utils

해당 디렉토리에서는 서버 요청과 api 요청 관련한 파일들을 다루고 관리해야 한다.

### requestToSrv

#### 규칙

1. 서버나 api 요청이 있는 경우에만 해당 requestToSrv.tsx를 생성하도록 한다.
2. 타입을 제대로 명시하도록 한다.(any 처리 금지.)
3. 요청 url은 별도의 변수로 관리하도록 한다.

#### 예시

```tsx
const url = "https://api요청 주소";

export interface ApiError {
  detail: {
    loc: (string | number)[];
    msg: string;
    type: string;
  }[];
}
.
.
.

export const RequestEmailSignUp = async (
  body: EmailSignUpRequest,
): Promise<EmailSignUpResponse | null> => {
  try {
    const res = await fetch(`${url}/auth/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const errorData: ApiError = await res.json();
      console.error("EmailSignUp Error", errorData);
      return null;
    }

    return await res.json();
  } catch (error) {
    console.error("EmailSignUp Fetch Error", error);
    return null;
  }
};
```
---

## 2부. SEO 홈페이지에서 더한 규칙 (예시컴퍼니, 2026-10)

원문의 컨테이너 소제목은 이름이 섞여 있다. 역할은 이렇다: `ServerContainer`(클라이언트 컨테이너로 서버 블록을 감쌈, 데이터 요청) → `ClientContainer`(컨텍스트·Values) → `ServerBlock`(DefaultLayout 안에 섹션을 눈에 보이게 나열) / `ClientBlock`(상호작용만, 없으면 `export {}`).

### 공용 문구는 uiContent 하나에

- 여러 컴포넌트가 함께 쓰는 짧은 문구(aria-label, "출처:", "자세히", 단위 "위·회·원")는 `configs/contents/uiContent.ts`의 `uiText` 하나에 모은다. 컴포넌트 기본값(`label = uiText.caseFeatureLabel`)도 여기서 가져온다.
- 클라이언트 컴포넌트도 import하므로 큰 객체(팀 소개·링크 맵이 든 `commonContent` 등)와 나눈다. 큰 객체를 클라이언트 컴포넌트에서 import하면 그 내용이 전부 브라우저 번들에 들어간다.
- 페이지에서만 쓰는 문구(섹션 제목, 사례 라벨)는 그 페이지의 `<page>Content.ts`에 둔다.
- 예시컴퍼니는 2026-10-29에 TSX에 남은 문구 82개를 이 방식으로 옮겼다(문구 검사로 찾음, 화면 텍스트는 그대로).

### 메타데이터는 한 곳에서

- `configs/contents/seoContent.ts`에 `pageMeta`를 둔다. 페이지마다 `path`, `title`, `description`, `serviceName`(서비스·업종 페이지), `breadcrumb`.
- `utils/metadata.ts`의 `buildMetadata(meta)`가 `title.absolute`(키워드 순서 유지, 템플릿 붙이지 않음), `alternates.canonical`, Open Graph를 만든다. `page.tsx`는 `export const metadata = buildMetadata(pageMeta.seo)` 한 줄.
- 루트 `layout.tsx`: `metadataBase`, `title.template`, 기본 OG 이미지(1200×630), `<head>`에 `google-site-verification`·`naver-site-verification` 메타(값은 `companyInfo`), 조직 구조화 데이터.
- 사례·글 같은 상세 페이지는 `generateStaticParams` + `dynamicParams = false` + `generateMetadata`. 목록에만 있는 항목은 상세 주소가 404가 된다.

### 사이트맵·robots

- `app/sitemap.ts`는 `allPageMeta`(= `pageMeta` + 상세 항목)에서 자동 생성한다. 페이지를 추가하면 `pageMeta`에만 넣는다. 지우면 `pageMeta`에서 빼고 리디렉션을 건다.
- `lastmod`는 본문을 실제로 고친 날(`pageMeta.updatedAt`)만 넣는다. `new Date()`로 매 빌드 날짜를 넣지 않는다. 구글은 부정확한 lastmod를 무시하고, `changefreq`·`priority`는 읽지 않으므로 넣지 않는다.
- 사이트맵에는 200으로 열리고 canonical이 자기 주소이며 noindex가 아닌 주소만 넣는다. 리디렉션·noindex·파라미터 주소는 넣지 않는다.
- 주소가 5만 개 또는 50MB를 넘으면 `generateSitemaps`로 나눈다.
- `app/llms.txt/route.ts`: 같은 `allPageMeta`·`companyInfo`로 `/llms.txt`(llmstxt.org 형식 마크다운: `# 브랜드`, `> 설명`, 페이지 목록 `- [제목](주소): 설명`, 연락처)를 만든다. AI 검색·에이전트용 안내이며 아직 제안 단계라 효과를 보장하지 않는다. 문구는 메타 설명을 그대로 쓰고 따로 만들지 않는다. robots.txt에서 AI 크롤러(GPTBot·ClaudeBot·PerplexityBot·Google-Extended 등)를 막지 않았는지 같이 본다.
- `app/rss.xml/route.ts`: 같은 `allPageMeta`로 RSS 2.0 피드(`/rss.xml`)를 만든다. 네이버 서치어드바이저 RSS 제출용이다. `<head>`에 `<link rel="alternate" type="application/rss+xml">`(메타데이터 `alternates.types`)를 넣는다. 같은 도메인 블로그가 있으면 서치어드바이저에는 블로그 피드(`/blog/feed/`)를 낸다.
- `app/robots.ts`: 전체 허용 + 사이트맵 주소(홈페이지 `sitemap.xml`, 블로그가 있으면 `blog/sitemap_index.xml`).
- 없어진 주소는 `next.config.ts`의 `redirects()`에 `permanent: true`로 둔다(예: `/google-business-profile` → `/marketing-mix`). 이미 색인 요청한 주소는 404로 두지 않는다.

### 구조화 데이터 (JSON-LD)

- `layout.tsx`: `Organization`(`@type`은 `companyInfo.schemaType`. 방문 매장은 `LocalBusiness`, 병원은 `MedicalClinic` 같은 하위 타입. `address`(PostalAddress)·`telephone`은 `companyInfo`에 값이 있을 때만 출력. `@id: <사이트>/#organization`, `alternateName`, `logo`, `sameAs`, `founder`, `knowsAbout`) + `WebSite`(`publisher`로 조직 연결). 브랜드명이 다른 것과 겹치면(예: 같은 이름의 영화가 있을 때) `alternateName`에 "예시컴퍼니 마케팅"처럼 구분 이름을 넣는다.
- 페이지마다 `buildPageJsonLd(meta, faq)`: `Service`(provider로 조직 연결) + `Article`(사례·글 상세, `publishedAt`이 있을 때. `datePublished`·`dateModified`·`author`·`publisher`를 조직 `@id`로) + `BreadcrumbList` + 화면에 있는 FAQ와 같은 문장의 `FAQPage`. 구글 FAQ 리치 결과는 종료됐지만 질문·답 구조를 읽히는 데 쓴다. 화면에 없는 질문은 넣지 않는다.
- 병원은 `MedicalClinic`·`Physician`·`OpeningHoursSpecification`을 쓰고 의료진과 병원을 `@id`로 잇는다(안양 내과의원 사례).
- 출력은 서버 컴포넌트 `JsonLd`(`<script type="application/ld+json">`).
- 스키마 값은 화면에 보이는 내용과 같아야 한다(주소·전화·영업시간·후기·가격). 화면에 없는 후기 별점(`AggregateRating`)·가격은 넣지 않는다.
- 업종별 추가 타입: 병원 `MedicalClinic`+`Physician`, 매장 `LocalBusiness`+`OpeningHoursSpecification`+`geo`, 상품 판매 `Product`+`Offer`, 행사·교육 일정 `Event`, 채용 `JobPosting`. 필요할 때만 넣는다.
- 배포 전 리치 결과 테스트(search.google.com/test/rich-results)와 Schema Markup Validator(validator.schema.org)로 주요 페이지를 확인한다. `meta-audit.mjs`는 페이지별 `@type` 목록을 보여 준다.

### 크롤러가 읽는 마크업

- 모든 페이지는 서버에서 그린다. 클라이언트 컴포넌트는 상호작용 부분만.
- 페이지당 H1 하나(첫 화면 제목). 섹션은 `aria-labelledby`로 소제목과 묶는다. 위치 경로(브레드크럼)를 화면에도 보여 준다.
- FAQ 탭·아코디언은 모든 질문과 답을 DOM에 둔다(비활성 탭은 `hidden`). 클릭할 때 불러오지 않는다.
- 페이지 아래 "함께 보면 좋은 페이지"로 관련 페이지를 잇는다(`commonContent`의 링크 맵에서 고름). 지운 페이지는 맵에서도 뺀다.
- 이미지는 `next/image` + `imageUrl.ts`의 `width`·`height`, `images.formats: ["image/avif", "image/webp"]`. 검색 화면 캡처는 WebP로 저장하고, 캐시 때문에 교체가 안 보이면 파일 이름을 바꾼다.

### GA4·속도

- `components/layout/GoogleAnalytics.tsx`: 운영 빌드에서만, `gtag.js`는 `lazyOnload`. 이 방식이면 서치콘솔의 "Google 애널리틱스로 소유 확인"이 실패하므로 소유 확인은 메타 태그 + HTML 파일로 한다(`references/launch.md`).
- 글꼴은 `next/font`(로컬 woff2). 움직임은 CSS 스크롤 기반으로, `@supports`와 `prefers-reduced-motion`으로 감싼다. 모든 섹션에 등장 효과를 넣지 않는다.
- Tailwind v4에서 `text-body-1` 같은 글자 크기 토큰을 만들면 `tailwind-merge`가 색상으로 오인해 `text-white`를 지운다. `lib/utils.ts`의 `extendTailwindMerge`에 font-size 그룹으로 등록한다.
- 출시 전 PageSpeed 모바일·데스크톱을 재고 날짜와 함께 기록한다. 화면에 점수를 쓰면 측정일을 붙인다.

### 문의 폼

- `mailto:`로 만들지 않는다(신청자가 메일 앱에서 안 보내면 유실). `app/api/contact/route.ts`가 받아 외부 수신처(Google Apps Script: 메일 여러 곳 + 시트 백업)로 넘긴다.
- 라우트에서 필수값 확인, 봇용 숨김 칸(`website`)이 채워지면 성공처럼 응답하고 버린다.
- 수신 주소·키는 서버 전용 파일(`configs/urls/contactWebhook.ts`, 라우트에서만 import) + 환경변수 우선. 빌드 후 `.next/static`에 키가 없는지 grep으로 확인한다.
- 화면 상태: 보내는 중 / 접수 완료 / 실패(전화·메일 안내). 뼈대는 `assets/starter/`.

### 저장소·배포

- 같은 도메인 `/blog`는 프록시(`references/blog-proxy.md`). 블로그 사이트맵은 워드프레스(Rank Math)가 만든다.
- 팀 저장소는 새 브랜치 + PR만. 주제별로 PR을 나누고(문구·폼·이메일 등), 본문에 바뀐 것·확인한 것을 적는다. 머지는 저장소 주인이 한다(Vercel은 팀 멤버가 머지한 커밋만 배포한다).
- PR 전 확인: `tsc --noEmit`, `next build`, 로컬에서 전 라우트 200, 지운 주소의 리디렉션, 사이트맵 개수, 지운 주소로 가는 내부 링크 0개.
