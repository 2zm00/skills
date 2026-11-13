# 시안 → 선택 → 확정

사이트를 처음 만들 때 여러 시안을 같은 앱 안에 띄워 보여 주고, 사용자가 고른 하나를 확정한 뒤 나머지 페이지를 만든다. 이미 운영 중인 사이트를 고칠 때는 쓰지 않는다. 그때는 SKILL.md "색인된 페이지 수정"을 따른다.

## 1. 언제

- IA 문서를 사용자가 확인한 뒤에 한다. 시안에는 확정된 홈 H1·첫 화면 문구가 들어가야 한다.
- 스타터를 먼저 깐다(SKILL.md 4단계 "스타터 쓰는 법"). 시안은 그 앱 안에 만든다.

## 2. 범위와 개수

- 범위: 상단 헤더 + 홈 첫 화면 + 주요 섹션 1~2개 + 푸터. 나머지 페이지는 확정 후에 만든다.
- 개수: 기본 5개.
- 헤더·푸터처럼 굵직한 부분의 스타일이 시안마다 따로 갈린다면, 시안 수는 부분별 선택지의 조합 수로 정한다. 예를 들어 헤더 2종 × 첫 화면 3종이면 6개다.
- 조합 수가 5를 넘으면 만들기 전에 사용자에게 수와 조합표를 보여 주고 확인받는다.
- 시안끼리는 문구를 똑같이 쓴다. 문구는 `configs/contents/mainContent.ts` 하나를 공유하고, 디자인만 비교한다.
- 각 시안은 방향이 실제로 달라야 한다. 색만 바꾼 시안은 한 개로 친다. 방향은 `design-tooling.md`의 도구로 뽑는다(taste 방향 제안, impeccable `generate`).

## 3. 구조

```
src/app/drafts/layout.tsx         # robots noindex·nofollow. 루트 Header/Footer를 쓰지 않는 레이아웃
src/app/drafts/page.tsx           # 시안 목록: 시안별 링크, 한 줄 설명, 조합(헤더 A + 첫 화면 B …)
src/app/drafts/<id>/page.tsx      # id = a, b, c …  메타데이터 + DraftServerContainer 호출만
src/container/Drafts/<Id>/        # 시안마다 컨테이너 4파일 (frontend-rules.md 규칙 그대로)
src/components/drafts/<부분>/<변형>.tsx   # 시안끼리 공유하는 헤더·푸터·섹션 변형
src/configs/contents/draftsContent.ts     # 목록 페이지 문구와 시안 설명
```

- 시안 경로는 `pageMeta`에 넣지 않는다. 그래서 `sitemap.ts`, `rss.xml`, `llms.txt`에서 자동으로 빠진다.
- `drafts/layout.tsx`의 metadata에 `robots: { index: false, follow: false }`를 둔다. `robots.ts`에 Disallow는 넣지 않는다. Disallow를 걸면 크롤러가 noindex를 읽지 못한다.
- 루트 `layout.tsx`가 Header/Footer를 그리면 시안마다 헤더를 바꿀 수 없다. 시안 단계에서는 Header/Footer를 `src/app/(site)/layout.tsx`로 옮긴다. 루트 레이아웃에는 html·body·글꼴·GA만 남기고, 기존 페이지는 `(site)` 아래로 옮긴다. 이 구조는 확정 후에도 그대로 둔다.
- 보여 주기: 로컬은 `http://localhost:<포트>/drafts`. 원격은 배포 미리보기 URL의 `/drafts`. 운영 도메인에는 시안을 올리지 않는다.
- 시안마다 375·768·1440 폭 스크린샷을 찍어 목록 페이지나 보고에 붙인다(Aside나 Chrome. 둘 다 없으면 사용자에게 열어 보라고 안내한다).

## 4. 선택

- 사용자가 시안 하나를 고르거나 부분별로 고를 수 있다(예: "헤더는 b, 첫 화면은 d"). 부분별로 고르면 그 조합으로 시안 하나를 더 만들어 확인받는다.
- 고르기 전에는 다른 페이지를 만들지 않는다.

## 5. 확정

1. 기록: `docs/<브랜드>_시안선택_vN.md`에 고른 시안(조합), 이유, 날짜, 후보 전체의 스크린샷 경로를 적는다.
2. 디자인 시스템 고정: 고른 시안의 색·글꼴·간격·모서리·움직임 토큰을 `styles/theme.css`와 `DESIGN.md`로 옮긴다. `DESIGN.md` 맨 위에 "확정: <날짜>, 시안 <id>"를 적는다. 이후 페이지는 이 파일만 따른다.
3. 승격: 고른 시안의 헤더·푸터·섹션을 `components/layout/`과 `container/Main/`으로 옮긴다.
4. 삭제: `src/app/drafts/`, `src/container/Drafts/`, `src/components/drafts/`, `draftsContent.ts`를 지운다. 고르지 않은 시안 코드는 남기지 않는다(스크린샷만 docs에 남는다).
5. 확인: `next build` 통과, `meta-audit.mjs`에 `/drafts`가 나오지 않는지, 사이트맵에 시안 주소가 없는지 본다.

그다음 SKILL.md 4단계로 가서 나머지 페이지를 만든다.
