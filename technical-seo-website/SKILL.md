---
name: "technical-seo-website"
description: "테크니컬 SEO를 넣은 Next.js 홈페이지(회사·병원·B2B·랜딩)의 설계·개발·런칭·수정, 페이지별 키워드·메타타이틀 전략(네이버·구글 검색량, SERP, 다국어), 기존 사이트 테크니컬 SEO 진단 리포트(103개 체크리스트, docx)를 한 스킬에서 맡는다. 프론트 코드 규칙, IA·메타타이틀, 구조화 데이터·사이트맵, 시안 선택, 런칭 당일 서치콘솔·서치어드바이저·빙·IndexNow·GA4 등록, 색인된 페이지 수정(30% 규칙·301)을 담는다. '홈페이지 만들어줘', '테크니컬 SEO 홈페이지', '랜딩페이지 제작', '기존 홈페이지 수정', '사이트 런칭', '서치콘솔 등록', '메타타이틀 잡아줘', '키워드 전략', '검색량 확인', 'SERP 봐줘', '테크니컬 SEO 진단', 'SEO 진단 리포트', '/SEO홈페이지', '/키워드전략', '/SEO진단' 요청이면 먼저 확인."
---

# 테크니컬 SEO 홈페이지

목표: 크롤러가 모든 페이지를 읽고, 페이지마다 다른 검색어를 맡고, 런칭한 날부터 구글·네이버·빙에 등록된 홈페이지. SEO·AEO·GEO를 나중에 덧붙이지 않고 설계 단계부터 넣는다. 기준 구현 예시는 `references/example-implementation.md`의 가상 사이트 예시컴퍼니(example.com)다. 예시의 이름·주소·수치는 구조를 보여 주는 용도이며 실제 프로젝트 값으로 바꿔 쓴다.

## 작업 고르기

| 요청 | 따라갈 곳 |
|---|---|
| 새 홈페이지 제작·런칭, 운영 중인 우리 사이트 수정 | 아래 "순서" 1~8단계 |
| 키워드·메타타이틀 전략만 (남의 사이트, 병원·로컬, 다국어 포함) | `references/keyword/strategy.md` |
| 기존 사이트 테크니컬 SEO 진단 리포트 | `references/audit/audit.md` |

세 작업은 스크립트를 같이 쓴다. 검색량은 `scripts/keyword/volumes.mjs`, 제목 폭은 `scripts/keyword/title-px.mjs`, 페이지 실측은 `scripts/audit/site-probe.mjs`다. 하위 문서에 적힌 경로도 모두 이 스킬 폴더 기준이다.

## 실행 환경

경로는 이 스킬 폴더 기준이다.

| 환경 | 이렇게 한다 |
|---|---|
| Aside 브라우저 (맥) | 전부 가능. 빌드는 `NEXT_TELEMETRY_DISABLED=1 npx next build --webpack`(네이티브 바이너리 차단 우회), 미리보기는 매번 새 포트. 라우트를 지운 뒤 타입 오류가 나면 `rm -rf .next`. node가 안 잡히면 `~/.aside/runtime/bin/node`. 검색엔진 등록은 `references/launch.md`의 브라우저 절차 |
| Claude Code | 코드·빌드·`scripts/*.mjs` 실행. 검색엔진 등록과 SERP 확인은 사용자에게 화면 단계를 안내한다. 새 프로젝트는 `assets/AGENTS.md`를 루트에 둔다 |
| Claude 앱 | 규칙과 `assets/starter/`로 코드·IA 문서 초안을 만든다. 검색량·SERP는 사용자가 준 표·캡처로 판정한다 |

### 시작할 때 확인 (최초 1회)

1단계 입력을 받을 때(키워드·진단 단독 작업이면 시작할 때) 아래를 확인하고, 없는 것과 그 때문에 바뀌는 단계를 한 번에 알린다. 없어도 멈추지 않고 진행한다.

| 확인 | 방법 | 없을 때 |
|---|---|---|
| Aside 브라우저 | `ls -d /Applications/Aside.app ~/Applications/Aside.app 2>/dev/null` | 처음 한 번만 설치를 권한다: `brew install --cask aside` 또는 https://aside.com (macOS 13+, 필수 아님). 설치하지 않으면 아래 "Aside 없이" 열대로 진행한다. 그 뒤에는 해당 단계에서 "Aside를 처음에 설치하지 않아 ○○를 생략(수동 안내)합니다" 한 줄만 쓰고 다시 권하지 않는다 |
| 진단 리포트용 파이썬 패키지(진단할 때만) | `python3 -c "import docx, PIL"` | `pip install python-docx pillow`를 안내한다. 설치하지 않으면 판정 JSON까지만 만들고 docx 리포트와 캡처 자르기는 생략한다고 알린다 |
| 검색량 측정 사이트(마피아넷·keyword-analyzer-topaz, 로그인 없이 공개 호출) | `node scripts/keyword/volumes.mjs --naver "홈페이지제작" --out <tmp>`가 숫자를 내는지 본다 | 검색량을 직접 재지 않는다. `references/keyword-ia.md` §2 "측정 도구가 없을 때"를 따른다 |

**Aside가 필요한 단계**

| 단계 | Aside 있을 때 | Aside 없이 |
|---|---|---|
| 한국 SERP 확인 (`keyword-ia.md` §3) | 에이전트가 직접 본다 | 키워드별 네이버·구글 검색 화면 캡처를 사용자에게 요청한다. 받지 못한 키워드는 IA 문서 근거 칸에 "SERP 미확인"으로 적고 검색량으로만 판정한다 |
| 검색엔진 등록·색인 요청 (`launch.md` §1~4) | 브라우저로 진행한다(§9 요령) | §1~4를 사용자에게 화면 단계로 안내한다. 결과는 `launch-check.mjs`로 확인한다 |
| 네이버 로그인·보안 문자, 빙 좌표 클릭 (`launch.md` §9) | Aside 비밀번호 관리자·캡처로 처리한다 | 사용자가 직접 입력한다. §9는 생략한다 |
| 빌드 우회(`--webpack`)·`~/.aside/runtime/bin/node` | Aside 안에서만 쓴다 | 필요 없다. 일반 `next build`를 쓴다 |

## 순서

1. **입력**: 업체명, 업종, 서비스 목록, 지역·목표 시장, 경쟁사, 도메인, 블로그 여부, 로고·디자인 시스템, 사업자 정보, 서치콘솔·GA·서치어드바이저를 만들 계정. 없는 값은 기본값으로 시작하고 가정한 것을 보고에 적는다(선조치 후보고). 같은 때 위 "시작할 때 확인"을 한다.
2. **키워드·IA** → `references/keyword-ia.md`. 페이지마다 키워드 3슬롯을 네이버·구글 검색량과 SERP로 정하고 `docs/<브랜드>_IA_메타타이틀_vN.md`를 만든다. 사용자 확인 후 개발한다.
3. **시안 → 선택 → 확정** (새 사이트만) → `references/drafts.md`. 스타터를 깐 뒤 같은 앱의 `/drafts`에 헤더·홈 첫 화면·주요 섹션 1~2개·푸터 시안을 기본 5개 띄운다(부분별 스타일이 갈리면 조합 수만큼, 5개 초과면 먼저 확인). 시안은 `pageMeta`에 넣지 않고 noindex로 둔다. 고른 시안을 `DESIGN.md`·`theme.css`에 고정하고 나머지 시안 코드는 지운 뒤 4단계로 간다.
4. **개발** → `references/frontend-rules.md`(사용자 원문 규칙 + SEO 추가 규칙), 뼈대는 `assets/starter/`. 메타데이터·구조화 데이터·사이트맵은 모두 `seoContent.ts`의 `pageMeta` 하나에서 나온다. `/blog`를 같은 도메인에 붙이면 `references/blog-proxy.md`.
   - 스타터 쓰는 법: `npx create-next-app@latest <폴더> --ts --tailwind --eslint --app --src-dir --import-alias "@/*"` → `npm i clsx tailwind-merge` → `assets/starter/`를 덮어쓴다 → 글꼴 파일을 `src/app/fonts/PretendardVariable.woff2`로 둔다 → `companyInfo.tsx`·`seoContent.ts`·`mainContent.ts`를 채운다. 새 페이지는 `container/Main` 4파일을 복사해 이름만 바꾸고 `pageMeta`에 한 줄 추가한다(사이트맵 자동 반영).
   - 사이트맵(`sitemap.ts`)·RSS(`rss.xml/route.ts`)·`llms.txt`(`llms.txt/route.ts`)·구조화 데이터(Organization 또는 LocalBusiness·MedicalClinic / WebSite / Service / Article / BreadcrumbList / FAQPage)가 모두 `allPageMeta`·`companyInfo`에서 나온다. 페이지를 고친 날은 `updatedAt`에 적는다(사이트맵 lastmod·RSS·Article에 반영).
   - 스타터는 2026-10-29 Next 16에서 `tsc`·`next build` 통과, 홈 H1 1개·canonical·소유 확인 메타·Organization/WebSite/FAQPage 출력까지 확인했다. 2026-11-13 Next 16.4.6에서 `create-next-app`이 Tailwind 로더를 `next.config.ts`에 넣으므로 스타터 `next.config.ts`에도 같은 `turbopack.rules`를 넣었다. 덮어쓴 뒤 화면에 스타일이 실제로 들어가는지 본다.
   - `create-next-app`이 만든 `AGENTS.md`(Next 자체 안내)는 지우지 않는다. `assets/AGENTS.md` 내용을 그 뒤에 이어 붙인다.
5. **카피·디자인** → `references/copy-design.md`. `node scripts/copy-lint.mjs <프로젝트>`로 TSX 하드코딩 문구, AI 말투, 금지 표현, 용어 불일치를 잡는다.
   - 섹션 제작·다듬기·검수 도구(impeccable·inspo·DESIGN.md) → `references/design-tooling.md`. 도구가 TSX에 넣은 문구는 configs로 옮긴다.
6. **출시 전 점검**: `tsc` → `next build` → 로컬 전 라우트 200 → `node scripts/meta-audit.mjs http://localhost:<포트> --site-url https://<도메인> --brand <브랜드>`(canonical이 운영 주소라 `--site-url`로 로컬에 맞춘다) → copy-lint("스타터 자리표시 잔여"가 0이어야 한다) → `npx impeccable detect`(`references/design-tooling.md`) → PageSpeed 모바일·데스크톱(측정일 기록).
7. **런칭 등록** → `references/launch.md`. 서치콘솔·서치어드바이저·빙·IndexNow·GA4↔서치콘솔 연결을 런칭 당일 한 번에 끝낸다.
   - 확인: `node scripts/launch-check.mjs https://<도메인> --files <구글 확인 파일>,<네이버 확인 파일> --indexnow-key <키> --ga G-… --blog /blog/` (실패 0개가 목표).
   - 알림: `node scripts/indexnow-submit.mjs --host <도메인> --key <키>` (먼저 `--dry`로 주소 수 확인). 응답 200·202가 정상.
8. **운영 중 수정**: 아래 "색인된 페이지 수정"을 따른다.

## 지킬 것 (사용자 확정 규칙)

- 문구는 TSX에 쓰지 않는다(aria-label·단위·"출처:" 포함). 페이지 문구는 `configs/contents/<page>Content.ts`, 여러 컴포넌트가 쓰는 짧은 문구는 `configs/contents/uiContent.ts`, 회사 정보는 `configs/companyInfo.tsx`, 이미지 경로는 `configs/urls/imageUrl.ts`.
- `page.tsx`는 메타데이터와 ServerContainer 호출만. 페이지마다 `container/<Page>/` 4파일.
- 메타타이틀은 `키워드 · 키워드 · 키워드 | 브랜드`, 561px 이하. 한 키워드는 한 페이지만 맡는다. 채널 이름(인플루언서마케팅 등)보다 전문 용어(IMC마케팅·통합마케팅 등).
- 네이버 월 3,000 이하이고 웹사이트 블록에 민간 사이트가 보이면 제목만으로 노릴 슬롯이다. 3슬롯 중 하나 이상은 이런 슬롯으로 채운다. 3,000 초과는 웹사이트 블록에 업체가 들어올 때만 제목에 넣고, IA 문서에 "3천↑ 본문 보강"으로 표시해 허브·비교표·FAQ 같은 본문을 같이 만든다(제목만으로는 안 오른다).
- 검색량·순위·성과 숫자는 측정값과 측정일을 그대로 쓴다. 네이버 0은 "10 미만". 지어낸 후기·통계·임시 수치는 넣지 않는다.
- 고객사 이름은 서면 동의 전까지 업종·지역으로만 쓴다. 캡처는 이름·주소·썸네일을 가린다.
- 런칭은 GA를 붙이는 것으로 끝나지 않는다. 검색엔진 소유 확인 방법을 GA와 같이 정하고 런칭 당일 등록·사이트맵 제출·색인 요청까지 한다.
- 색인된 페이지에서 한 페이지 30% 이상 바꾸거나 제목·H1·주소·canonical을 바꿀 때는 적용 전에 사용자에게 비율과 내용을 알린다.
- 페이지를 지울 때 404로 두지 않는다. 가장 가까운 페이지로 301, 사이트맵·내부 링크·관련 링크·폼 선택지·IA 문서까지 정리한다.
- 팀 저장소(example-org/example-site 등)는 새 브랜치 + PR만 올린다. 사용자가 "머지해"라고 해도 머지하지 않고 저장소 주인에게 넘긴다.
- 토큰·폼 키 같은 비밀값은 저장소·문서·채팅에 쓰지 않는다. 서버 전용 파일 + 환경변수.

## 색인된 페이지 수정

1. 바꿀 페이지마다 화면 문구·섹션·제목·H1·메타 설명의 변경 비율을 어림한다(사이트 전체가 아니라 페이지 단위).
2. 30% 이상이거나 제목·H1·주소·canonical이 바뀌면 멈추고 보고한다: 페이지, 비율, 바뀌는 것, 두 번에 나누는 작은 대안.
3. 제목을 바꾸면 새 키워드를 첫 화면 설명·메타 설명·FAQ 중 한두 곳에도 넣어 제목과 본문을 맞춘다.
4. IA 문서를 같은 날 갱신한다: 이전 → 변경, 이유, 검색량(측정일).
5. 배포 후 서치콘솔에서 해당 주소를 다시 색인 요청하고 IndexNow로 알린다. 페이지를 지웠으면 `launch-check.mjs --removed "/옛주소>/새주소"`로 301·308을 확인하고 `meta-audit.mjs`로 사이트맵에 남은 주소가 없는지 본다.

## 파일

| 파일 | 내용 |
|---|---|
| `references/frontend-rules.md` | 사용자 프론트 규칙 원문 + 예시컴퍼니에서 정한 SEO 코드 규칙 |
| `references/keyword-ia.md` | 검색량·SERP 판정, 메타타이틀 공식, IA 문서 형식, 예시컴퍼니 예시 |
| `references/copy-design.md` | 합니다체·금지 표현·용어 표, FAQ·숫자·익명 규칙, 디자인 금지 패턴 |
| `references/drafts.md` | 새 사이트 시안: 범위·개수(기본 5, 조합 수), `/drafts` 구조·noindex, 선택·확정 기록, 탈락 시안 삭제 |
| `references/keyword/` | 키워드·메타타이틀 전략: `strategy.md`(흐름), `rules.md`(판정 R0~R13), `tool-recipes.md`(측정·SERP·서치콘솔), `output-template.md`, `naver-blog-focus.md` |
| `references/audit/` | 테크니컬 SEO 진단: `audit.md`(흐름), `checklist.md`·`checklist.json`(103개), `tiers.md`, `report-style.md`, `recipes.md`, `data-requests.md` |
| `scripts/keyword/` | `volumes.mjs`(검색량), `title-px.mjs`(제목 폭), `serp-intent.mjs`, `kw-table.mjs`, `kw-expand.mjs`(자동완성 확장), `mapia-rank-diff.mjs` |
| `scripts/audit/` | `site-probe.mjs`, `sf-summary.mjs`, `url-patterns.mjs`, `checklist.mjs`, `build_report.py`(docx), `crop.py` |
| `references/design-tooling.md` | anti-slop 디자인 도구(impeccable·inspo·DESIGN.md) 설치·흐름·감지기·테스트 결과 |
| `references/launch.md` | 서치콘솔·서치어드바이저·빙·IndexNow·GA4 등록 절차와 브라우저 요령 |
| `references/blog-proxy.md` | `/blog`를 같은 도메인 워드프레스로 프록시하는 작업 지시 원문 |
| `references/example-implementation.md` | 예시컴퍼니 구현 지도, 계정·ID, 결정과 교훈 |
| `assets/starter/` | page·컨테이너 4파일·seoContent·sitemap·rss.xml·llms.txt·robots·layout·GA·문의 폼(API·Apps Script) 뼈대 |
| `assets/AGENTS.md` | 다른 도구(Claude Code·Cursor·ChatGPT)에 그대로 붙이는 규칙 프롬프트 |
| `scripts/meta-audit.mjs` | 사이트맵 전 페이지의 제목 폭·H1·설명·canonical·noindex·구조화 데이터·자리표시 잔여·키워드 겹침(부분 겹침 포함) 점검 |
| `scripts/launch-check.mjs` | robots·사이트맵·RSS·llms.txt·소유 확인 태그·확인 파일·GA·OG 이미지·IndexNow 키·http/www 통일·404·지운 주소 리디렉션·블로그 점검 |
| `scripts/copy-lint.mjs` | TSX 하드코딩 문구(JSX 텍스트·속성·기본값), 접근성 라벨, 스타터 자리표시 잔여, AI 말투, 금지 표현, 구어, 용어 불일치, 해요체 혼입 검사 (`--terms`로 용어 표 추가) |
| `scripts/indexnow-submit.mjs` | 사이트맵 주소 전체를 IndexNow(빙·네이버 등)에 제출 |
| `scripts/lib/ai-tells-rules.mjs` | copy-lint가 쓰는 AI 말투 규칙 75개(블로그 글쓰기 스킬에서 복사, "바로 보입니다" 오탐 수정) |
| `assets/starter/apps-script/contact.gs` | 문의 메일 여러 곳 발송 + 시트 백업 웹 앱 |
| `assets/starter/docs/ia-meta-title-template.md` | IA·메타타이틀 문서 빈 양식 |

## 함께 쓰는 스킬

- `seo-quick-check`(설치되어 있을 때만): URL 하나 빠른 진단. 없으면 `scripts/audit/site-probe.mjs`.
- 블로그 글쓰기 스킬(예: `example-blog`): example.com/blog 글 작성·발행.
- `frontend-design`: 시각 방향 일반 원칙. 이 스킬의 디자인 금지 패턴이 우선한다.
- `impeccable`: 섹션 제작·검수. 쓰는 법과 우선순위는 `references/design-tooling.md`.
