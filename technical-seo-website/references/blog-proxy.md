# /blog 프록시 (같은 도메인 워드프레스)

블로그를 `blog.<도메인>` 같은 하위 도메인이 아니라 `<도메인>/blog/`로 보이게 해서 검색 신호를 한 도메인에 모은다. 아래 1부는 사용자가 준 작업 지시 원문(2026-10-21)이다.

## 1부. 작업 지시 원문



이 Next.js 프로젝트에 `/blog` 경로를 blog-template(WordPress + 공용 Traefik)으로 띄운 블로그로 프록시하는 기능을 이식해줘.
원본은 Next.js를 사용하는 프론트엔드 프로젝트(Next 16.1.6)이고, 아래 3가지를 옮기면 된다.

### 0. 블로그 쪽 값 (blog-template `.env`와 맞춰야 함)

공개 주소(정식 URL)는 `https://<도메인>/blog/` 이고, 블로그 서버는 `blog.<도메인>`에 숨어 있는 원본이다.
proxy는 경로를 그대로 보존해서 `https://<도메인>/blog/x` → `https://blog.<도메인>/blog/x` 로 보낸다. 그래서 블로그 `.env`는 이렇게 설정되어 있어야 한다.

| 블로그 `.env`   | 값                       | 이유                                                                             |
| --------------- | ------------------------ | -------------------------------------------------------------------------------- |
| `DOMAIN`        | `blog.<도메인>`          | Traefik이 이 Host로 라우팅하고 인증서를 발급. `BLOG_ORIGIN`의 호스트와 같아야 함 |
| `PUBLIC_DOMAIN` | `<도메인>` (Next 사이트) | WordPress 링크·리다이렉트·쿠키가 방문자 주소를 쓰게 함                           |
| `BLOG_PATH`     | `/blog`                  | proxy가 경로를 보존하므로 matcher 경로와 같아야 함                               |

`BLOG_ORIGIN`에는 경로 없이 `https://blog.<도메인>`만 넣는다. `blog.<도메인>` DNS는 블로그 서버를 가리켜야 한다.

### 1. proxy 파일 추가

아래 코드를 추가해.

```ts
import { NextRequest, NextResponse } from "next/server";

export function proxy(req: NextRequest) {
  const incoming = new URL(req.url);
  const origin = process.env.BLOG_ORIGIN;

  if (!origin) {
    return new NextResponse("BLOG_ORIGIN is not configured", {
      status: 503,
      headers: { "Cache-Control": "no-store" },
    });
  }

  const destination = new URL(origin);
  destination.pathname = incoming.pathname;
  destination.search = incoming.search;

  // Preview 진단용: query, cookie 등은 기록하지 않습니다.
  console.log("[blog-proxy]", {
    inputPath: incoming.pathname,
    destinationPath: destination.pathname,
  });

  const response = NextResponse.rewrite(destination);
  response.headers.set("X-Blog-Router", "preserve-slash-v1");

  return response;
}

export const config = {
  matcher: ["/blog/:path*"],
};
```

- 위치: 프로젝트가 `src/`를 쓰면 `src/proxy.ts`, 아니면 루트 `proxy.ts`.
- **Next 버전 확인**: `package.json`의 `next`가 16 미만이면 파일명은 `middleware.ts`, 함수명은 `export function middleware`로 바꿔.
- **기존 proxy/middleware 파일이 있으면** 새로 만들지 말고 기존 함수에 병합해. `/blog` 경로일 때만 위 로직을 타게 하고, 기존 `matcher`에 `/blog/:path*`를 추가해. 하나의 프로젝트에 파일은 하나만 인식된다.

### 2. next.config 플래그 추가

`nextConfig`에 아래 두 옵션을 추가해. 기존 설정은 유지.

```ts
skipTrailingSlashRedirect: true,
skipMiddlewareUrlNormalize: true,
```

- 이게 없으면 Next가 `/blog/` 끝 슬래시를 리다이렉트로 제거해서 블로그가 깨진다.
- Next 16에서는 `skipMiddlewareUrlNormalize`가 `skipProxyUrlNormalize`로 이름이 바뀌었을 수 있다. 빌드 시 deprecation 경고가 나오면 새 이름으로 바꿔.
- 기존 `rewrites()`에 `/blog` 관련 규칙이 있으면 proxy와 충돌하니 제거해.

### 3. 환경변수

`.env`에 추가:

```
BLOG_ORIGIN=https://blog.<도메인>
```

- `BLOG_PROXY_SECRET`은 원본 코드에서 쓰지 않으므로 넣지 않아도 된다.
- 배포 환경(Vercel 등)의 환경변수에도 `BLOG_ORIGIN`을 등록해야 한다고 작업 끝나고 알려줘. 없으면 `/blog`가 503을 반환한다.

### 검증

1. `next build`가 경고/에러 없이 통과하는지 확인.
2. `next dev` 실행 후 `curl -I http://localhost:3000/blog/` 로 응답 헤더에 `X-Blog-Router: preserve-slash-v1`가 있는지, 308 리다이렉트가 아닌지 확인.
3. `curl -sI http://localhost:3000/blog/` 가 WordPress 응답(200 또는 로그인/설치 리다이렉트)이고, `Location`이 있다면 `blog.<도메인>`이 아니라 `<도메인>`을 가리키는지 확인.
4. 결과와 변경한 파일 목록을 보고해줘.

## 2부. 예시컴퍼니 적용 메모

- Next 16에서는 `skipProxyUrlNormalize`를 쓴다(예시컴퍼니 `next.config.ts`). `src/proxy.ts`에 `export function proxy`.
- `.env`는 `BLOG_ORIGIN=https://blog.example.com`. 배포 환경(Vercel)에도 같은 값이 있어야 한다. 없으면 `/blog`가 503이다.
- 로컬 확인: `/blog/`, `/blog/category/seo/`, `/blog/?s=seo`, `/blog/wp-json/`이 200이고 `X-Blog-Router: preserve-slash-v1` 헤더가 붙는지 본다.
- `robots.ts`에 블로그 사이트맵(`/blog/sitemap_index.xml`)을 같이 적고, 서치콘솔·서치어드바이저에도 제출한다.
- 워드프레스 쪽 설정(퍼머링크 `/%postname%/`, Rank Math, 빈 카테고리·작성자 페이지 noindex, 첨부 페이지 리디렉션, 샘플 글·페이지 삭제)은 블로그 글쓰기 스킬(예: `example-blog`)의 `references/site-config.md`를 따른다.
