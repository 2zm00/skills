# 테크니컬 SEO 진단

예시성형외과 리포트(2026-07-28~08-11, 69개 항목 카드)와 체크리스트(89개)를 합친 103개 항목으로 진단한다. 결론은 증거로만 내고, 측정하지 않은 수치는 쓰지 않는다.

## 파일

| 파일 | 내용 |
|---|---|
| `references/audit/checklist.md` / `checklist.json` | 103개 항목: 중요도·구분(A/A+/B/C)·확인 방법·사람이 줄 것·간접 조사·범위·출처 |
| `references/audit/tiers.md` | B2C 라이트(핵심 26) / B2C 스탠다드(공통 50) / B2B 풀(103) 범위와 산출물 |
| `references/audit/report-style.md` | 카드 구조, 판정 기준(문제·보완·정상), 문장 규칙, 증거 이미지 규칙 |
| `references/audit/recipes.md` | 서치콘솔 드릴다운, 사이트맵 수집, 방화벽 사이트 원본/렌더 비교, 페이지 안 점검, 리치 결과 테스트, PSI, check-host, crt.sh, Wayback, 증거 캡처 |
| `references/audit/data-requests.md` | 클라이언트에게 받을 권한·자료와 요청 문구 |
| `scripts/audit/site-probe.mjs` | 리디렉션 체인·TTFB·헤더·HTML 요소(title·robots·canonical·hreflang·h·JSON-LD·alt), `--variants`(www·슬래시·http), `--soft404` |
| `scripts/audit/sf-summary.mjs` | 스크리밍프로그 Internal All CSV 요약·여러 사이트 비교표(응답·제목 px·단어 수·리디렉션·인링크) |
| `scripts/audit/url-patterns.mjs` | 서치콘솔 사유별 URL·사이트맵을 유형·경로 패턴으로 분류 |
| `scripts/audit/crop.py` | 화면 캡처에서 증거 영역 자르기·가리기 |
| `scripts/audit/build_report.py` | 판정 JSON → 예시성형외과 형식 docx (`init`으로 범위별 빈 판정 파일 생성) |
| `scripts/audit/checklist.mjs` | 체크리스트에서 범위·번호·필드만 골라 짧게 출력 (checklist.md 전체 대신) |

경로는 모두 이 스킬 폴더 기준이다. 실행은 `node scripts/audit/…`, `python3 scripts/audit/…`. python-docx·Pillow가 없으면 `pip install python-docx pillow`.

## 실행 환경

| 환경 | 이렇게 한다 |
|---|---|
| Aside (맥) | 전부 가능. 서치콘솔·리치 결과 테스트·PSI 같은 로그인/브라우저 단계는 `references/audit/recipes.md`의 REPL 코드. node가 안 잡히면 `~/.aside/runtime/bin/node` |
| Claude Code (터미널) | 스크립트(site-probe·sf-summary·url-patterns·build_report·crop)와 공개 페이지 점검. 서치콘솔·GA4는 사용자가 CSV·캡처로 준다. 리치 결과 테스트·PSI 화면도 사용자 캡처로 대체 |
| Claude 앱 (claude.ai) | 받은 CSV·캡처로 판정하고 `build_report.py`로 리포트 작성. 외부 사이트 직접 점검은 막힐 수 있어 확인한 범위를 리포트에 적는다 |

## 진행 순서

### 1. 범위 정하기
- 예산·사이트 규모로 `tiers.md`에서 B2C 라이트 / 스탠다드 / B2B 풀을 고른다. 다국어·리브랜딩·대량 발행·JS 프레임워크면 해당 조건부 항목을 더한다.
- 클라이언트 의견(목표 시장·언어, 핵심 서비스, 리브랜딩 이력)은 **범위 필터**로만 쓴다. 클라이언트가 말한 트래픽 수치는 원자료로 확인하기 전까지 사실로 쓰지 않는다.
- `python3 scripts/audit/build_report.py init --tier b2c|std|b2b --extra T39,T90 --out <tmp>/audit.json`

### 2. 권한·자료 요청 (먼저 보내 놓는다)
- 서치콘솔(가능하면 소유자), GA4 뷰어, 비즈니스 프로필 관리자. 옛 도메인이 있으면 옛 서치콘솔도.
- B 항목 자료(전체 크롤 CSV, 서버 로그, CDN·방화벽 화면, 개발 질문)는 `data-requests.md` 문구로 요청한다. 기다리는 동안 A 항목을 진행한다.

### 3. 수집 (`recipes.md`는 필요한 절만)
0. 공개 항목은 먼저 seo-quick-check 스킬의 `scripts/quick-check.mjs`로 한 번에 돌린다(설치되어 있지 않으면 `scripts/audit/site-probe.mjs --variants --soft404`로 같은 항목을 하나씩 본다)(robots·사이트맵·제목·h1·canonical·noindex·속도·JS·구조화 데이터·hreflang·링크·소프트 404 → T01·T02·T11·T23·T27·T41·T42·T44·T52·T53·T56·T63·T70·T85·T90). 결과 JSON을 근거로 쓰고 나머지 항목만 따로 확인한다.
1. 사이트 구조: 호스트(서치콘솔 크롤 통계·crt.sh), robots.txt, 사이트맵 전수(브라우저 안 fetch), 언어·서브도메인.
2. 서치콘솔(A+): 실적 3·16개월, 색인 사유별 URL 500개 → `url-patterns.mjs`, 크롤링 통계, 사이트맵, 코어 웹 바이탈, 수동 조치, 링크, 동영상.
3. 크롤: 스크리밍프로그 CSV가 있으면 `sf-summary.mjs`(경쟁사 CSV도 같이), 없으면 `site-probe.mjs`로 템플릿 대표 URL + 사이트맵 표본.
4. 페이지 실측: 원본 HTML vs 렌더 DOM, 페이지 안 점검(숨김 텍스트·h 구조·첫 화면 이미지·alt·JSON-LD 그래프·미사용 CSS·CLS 원인), PSI 모바일, W3C.
5. 외부 시점: 리치 결과 테스트(구글이 실제로 가져가는지), check-host(국가별 응답), site: 검색, Wayback(옛 URL).
6. 리브랜딩·이전 이력이 있으면 `recipes.md` §6 순서로 옛 도메인을 찾고 매핑 초안까지 만든다.

원자료는 바로 `<tmp>/` 파일로 저장한다. 원본 행을 채팅에 찍지 않는다.

### 4. 판정
- 항목마다 `checklist.md`의 확인 방법대로 보고 `report-style.md` 기준으로 문제·보완·정상을 정한다.
- 판정 문장은 원리 → 현재 조건 → 성립 조건 → 판정의 네 단계. 결과(순위·트래픽 상승)를 약속하지 않는다.
- 구분별 처리:
  - **A**: 끝까지 확인하고 판정한다.
  - **A+**: 권한이 없으면 "확인 불가(서치콘솔 권한이 있으면 확인 가능)"으로 두거나 공개 데이터로 대신 확인한 범위만 쓴다.
  - **B**: 자료를 받기 전에는 판정하지 않는다(`verdict: todo`로 두면 리포트에서 빠진다). 받은 뒤 분석은 에이전트가 한다.
  - **C**: "간접 조사" 칸의 방법으로 근거를 쌓고, 추정임을 문장에 밝힌다(예: 알고리즘 강등, 하락 원인, 현지 실제 순위, 경쟁사 트래픽, 의료광고 적법성).
- 같은 원인은 한 항목에 모으고 다른 항목에는 "N번 참조".

### 5. 증거
- 문제·보완 항목마다 1장 이상. 파일 이름 `<tmp>/evidence/<번호>-<이름>-<순번>.png`.
- **이 REPL의 `page.screenshot({clip})`은 x·y를 무시하고 왼쪽 위부터 자른다.** 화면 전체를 찍고 `crop.py`로 자른다(`recipes.md` §8의 `clipAround`로 상자 계산). 계정 아이콘·연락처는 `--mask`로 가린다.
- 화면이 없는 증거(원본 HTML·헤더·체인·크롤 표)는 증거 카드로 만든다.
- 확인은 `display()` 1~2장만. 나머지는 파일 크기로 확인한다.

### 6. 리포트
- audit.json에 summary·evidence·images·opinion을 채우고 `python3 scripts/audit/build_report.py render audit.json --out <artifacts>/<사이트>_SEO기술진단_리포트.docx`.
- B2C는 `"cards": "issues"`(정상은 요약 표만), B2B는 `"cards": "all"`.
- 새 파일로 저장한다(덮어쓰지 않음). 바탕화면 전달이 필요하면 복사 후 파일 크기를 원본과 비교한다.
- 조치 우선순위 표는 자동 생성된다(문제 → 보완). 같은 원인끼리 묶어 손으로 다듬는다.

### 7. 마무리 검증
- 수치마다 출처(서치콘솔 화면·CSV·크롤·실측 시각)가 있는가. 기간·표본 범위가 문장에 있는가.
- 클라이언트 주장·추정치를 사실처럼 쓰지 않았는가. 확인 못 한 것은 "확인 불가 + 필요한 자료"로 남겼는가.
- 구글 정책 문장은 공식 문서·업데이트 기록으로 확인했는가(날짜 포함).
- 의료·YMYL은 최상급 표현·가격 표기 등 규제 표현을 표시만 하고 적법성 판단은 전문가 검토로 넘겼는가.
- 사용자에게는 구분별 개수(A·A+·B·C), 받지 못한 자료, 다음 조치 3개를 짧게 보고한다.

## 토큰 절약 (품질은 그대로)

- `checklist.md`(약 25KB)를 통째로 읽지 않는다. `node scripts/audit/checklist.mjs --tier b2c`(약 4KB), 항목을 판정할 때 `--no T17 --fields no,title,how,human,indirect`.
- `recipes.md`는 `grep -n "^## " references/audit/recipes.md`로 절 위치를 보고 그 절만 읽는다(서치콘솔 §1, 크롤 §2, 방화벽 §3, 페이지 안 점검 §4, 외부 도구 §5, 이전 §6, 경쟁사 §7, 캡처 §8).
- 서치콘솔 표·사이트맵·크롤 결과는 `evaluate`로 필요한 값만 뽑아 파일에 저장하고, 채팅에는 개수·상위 5개만 찍는다. 화면 읽기는 `snapshot(interactive)`나 범위 지정 스냅샷.
- 캡처는 파일로 저장하고 `display()`는 대표 1~2장만. 나머지는 파일 크기로 저장 여부만 확인한다.
- 같은 사이트의 이전 결과(JSON)가 있으면 다시 수집하지 않는다.

## 함께 쓰는 스킬
- URL만 받은 빠른 진단: `seo-quick-check` 스킬(설치되어 있을 때만).
- 스크리밍프로그 CSV 해석·경쟁사 크롤 비교: `scripts/audit/sf-summary.mjs`. 별도 `seo-screaming-frog` 스킬이 있으면 같이 쓴다.
- 메타타이틀·키워드·SERP 의도: `references/keyword/strategy.md`(같은 스킬).
- 블로그 글 단위 SEO: `example-blog`, `example-blog-2`.
- docx를 손볼 때: `docx` 스킬. 엑셀 이슈 시트(B2B): `xlsx` 스킬.
