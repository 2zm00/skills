# 진단 레시피 (REPL·스크립트, 2026-10 실사용 코드)

> JS 코드 블록은 **Aside 브라우저 REPL 전용**이다(openTab·snapshot·fs·page). Claude Code·Claude 앱에서는 `scripts/audit/`의 node·python 스크립트만 쓰고, 로그인 화면(서치콘솔·GA4)과 캡처는 사용자에게 받는다.

결과는 바로 `TMP` 파일로 저장한다(REPL 변수는 중간에 사라질 수 있음). 원본 행·HTML을 채팅에 찍지 않는다.

```js
var TMP = '<세션 tmp 절대경로>';
await fs.mkdir(TMP + '/evidence', { recursive: true });
```

## 1. 서치콘솔 (권한 필요, 제한 권한도 읽기 가능)

- 실적 표 500행: `references/keyword/tool-recipes.md` §5. 16개월은 `&num_of_months=16`(데이터 있는 기간만 나옴. 시작일이 늦으면 "데이터가 언제부터 있는지"를 보고에 적는다).
- 색인 보고서: `https://search.google.com/search-console/index?resource_id=<속성>&hl=ko`. 사유 표는 10행만 보인다. 파란 도움말 팝업의 `확인` 링크를 먼저 눌러 닫고, 페이지 화살표나 행 수(25)를 좌표 클릭으로 바꾼다. `tr[data-rowid]`의 `offsetParent!==null`인 것만 보이는 행이다.
- 사유별 URL 500개: 드릴다운 주소 `.../index/drilldown?resource_id=<속성>&item_key=<코드>&hl=ko`.

| 코드 | 사유 | 코드 | 사유 |
|---|---|---|---|
| CAMYCCAC | noindex 제외 | CAMYFiAC | 발견됨–색인 미생성 |
| CAMYCyAC | 리디렉션 포함 | CAMYFyAC | 크롤링됨–색인 미생성 |
| CAMYDSAC | 404 | CAMYECAC | 구글이 다른 표준 선택 |
| CAMYGCAC | 대체(적절한 표준) | CAMYDyAC | 중복(표준 없음) |
| CAMYMyAC | 403 | CAMYDiAC | 소프트 404 |
| CAMYFCAC | 리디렉션 오류 | CAMYByAC | robots.txt 차단 |
| CAMYCiAC | 401 | CAMYEyAC | 5xx |
| CAMYAiAC | 색인됨·사이트맵 미제출 | CAMYBSAC | 크롤링 대기 |

```js
var collectKey = async (pg, prop, key) => {
  await pg.goto(`https://search.google.com/search-console/index/drilldown?resource_id=${encodeURIComponent(prop)}&item_key=${key}&hl=ko`);
  await sleep(3000);
  const sn = await snapshot(pg, { interactive: true });
  const title = (sn.tree.match(/heading "([^"]+)" \[level=1\]/) || [])[1];
  const m = sn.tree.match(/listbox "페이지당 행 수" \[ref=(e\d+)\]/);
  if (m) { await pg.locator(m[1]).click(); await sleep(600); await pg.getByRole('option', { name: '500', exact: true }).click(); await sleep(2500); }
  const rows = await pg.evaluate(() => Array.from(document.querySelectorAll('table tbody tr')).filter(tr => tr.offsetParent !== null)
    .map(tr => Array.from(tr.querySelectorAll('td')).map(td => td.innerText.split('\n')[0].trim()).filter(Boolean)));
  return { title, rows };   // rows: [URL, 최종 크롤링일]
};
// 한 REPL 호출에 2~4개씩. 결과는 {key:{title,rows}}로 저장 → node scripts/audit/url-patterns.mjs index.json --sitemap sitemap_urls.json
```

- 크롤링 통계: `.../settings/crawl-stats?resource_id=<속성>&hl=ko` 본문 텍스트에 총 요청·평균 응답·호스트별 요청·응답 코드·목적·봇 유형 비율이 다 있다.
- 사이트맵: `.../sitemaps?...` 표(제출일·마지막 읽음·상태·발견 URL). 오류 행을 누르면 `태그 값이 잘못되었습니다` 같은 상세가 나온다.
- 기타 본문 텍스트로 읽기: `core-web-vitals`, `manual-actions`, `security-issues`, `links`, `video-index`.
- URL 검사: 상단 검색창 `combobox "<도메인>에 있는 모든 URL 검사"`에 fill → Enter → 10초 대기. `inspect?id=` 주소를 직접 만들면 404가 난다.
- "수정 결과 확인" 버튼이 비활성이면 제한 권한이다. 보고서의 데이터 한계에 적는다.

## 2. 크롤 데이터

- 스크리밍프로그 CSV: `node scripts/audit/sf-summary.mjs <csv...> --names a,b --detail <상세 URL 정규식들>` → 사이트 비교표와 상위 사례.
- 직접 점검(방화벽 없는 사이트, 수백 URL까지): 사이트맵에서 URL 목록을 만들고 `node scripts/audit/site-probe.mjs --file urls.txt --variants --soft404 --json probe.json`.
- 사이트맵 전수 수집(브라우저 안에서, 방화벽 사이트도 됨):

```js
const sm = await pg.evaluate(async (root) => {
  const g = async u => (await fetch(u)).text();
  const idx = await g(root + '/sitemap_index.xml');
  const maps = Array.from(idx.matchAll(/<loc>([^<]+)<\/loc>/g)).map(m => m[1]);
  const out = [];
  for (const m of maps) { const t = await g(m); for (const b of t.split('<url>').slice(1)) out.push([m.split('/').pop(), (b.match(/<loc>([^<]+)/) || [])[1], (b.match(/<lastmod>([^<]+)/) || [])[1]]); }
  return out;
}, 'https://<도메인>');
await fs.writeFile(TMP + '/sitemap_urls.json', JSON.stringify(sm));   // [파일, URL, lastmod]
```
  긴 루프는 CDP 타임아웃이 난다. 수천 개면 페이지 안에서 큐를 돌려 `window.__x`에 쌓고 REPL에서 기다린다.

## 3. 방화벽(WAF) 사이트와 원본·렌더 비교

- 일반 요청(REPL fetch·WebFetch·site-probe)이 403이면 사이트 탭을 열고 그 안에서 `fetch()`한다(같은 출처라 쿠키·브라우저 지문이 통과).

```js
var site = await openTab('https://<도메인>/');
const rawVsRendered = await site.evaluate(async () => {
  const raw = await (await fetch(location.href)).text();
  const d = new DOMParser().parseFromString(raw, 'text/html');
  const pick = (doc) => ({ title: doc.title, canonical: doc.querySelector('link[rel=canonical]')?.href || null,
    robots: doc.querySelector('meta[name=robots]')?.content || null, hreflang: doc.querySelectorAll('link[hreflang]').length,
    h1: doc.querySelectorAll('h1').length, jsonld: doc.querySelectorAll('script[type="application/ld+json"]').length,
    links: doc.querySelectorAll('a[href]').length, text: (doc.body?.innerText || doc.body?.textContent || '').replace(/\s+/g, ' ').length,
    metaInBody: doc.body ? doc.body.querySelectorAll('meta[name=robots],meta[name=description],link[rel=canonical],link[hreflang]').length : 0 });
  return { raw: pick(d), rendered: pick(document), rawBytes: raw.length };
});
```
  hreflang·canonical·본문이 원본에 없고 렌더에만 있으면 JS 주입(예시성형외과 10번). 원본 크기는 `rawBytes`.
- 브라우저 fetch는 리디렉션 상태 코드를 보여 주지 않는다(`r.redirected`, `r.url`만). 체인 코드가 필요하면 site-probe(방화벽 없을 때)나 서치콘솔 URL 검사.

## 4. 페이지 안 점검 (렌더 DOM)

```js
const inpage = await site.evaluate(() => {
  const out = {};
  const hidden = [];
  for (const el of document.body.querySelectorAll('*')) {
    if (['SCRIPT','STYLE','NOSCRIPT','TEMPLATE','svg','path'].includes(el.tagName)) continue;
    const txt = Array.from(el.childNodes).filter(n => n.nodeType === 3).map(n => n.textContent.trim()).join('');
    if (!txt && el.tagName !== 'A') continue;
    const cs = getComputedStyle(el), r = el.getBoundingClientRect(), why = [];
    if (cs.display === 'none') why.push('display:none'); if (cs.visibility === 'hidden') why.push('visibility:hidden');
    if (parseFloat(cs.opacity) === 0) why.push('opacity:0'); if (parseFloat(cs.fontSize) === 0) why.push('font-size:0');
    if (r.right < -100 || r.bottom < -100 || r.left > innerWidth + 2000) why.push('off-screen');
    if (cs.color === cs.backgroundColor && cs.backgroundColor !== 'rgba(0, 0, 0, 0)') why.push('same-color');
    if (why.length) hidden.push({ tag: el.tagName, text: (txt || el.getAttribute('href') || '').slice(0, 40), why });
  }
  out.hidden = { count: hidden.length, sample: hidden.slice(0, 8) };   // 후보일 뿐. 메뉴·탭·애니메이션인지 눈으로 확인
  out.h = Object.fromEntries(['h1','h2','h3','h4','h5','h6'].map(h => [h, document.querySelectorAll(h).length]));
  const imgs = Array.from(document.images);
  out.firstViewImgs = imgs.filter(i => { const r = i.getBoundingClientRect(); return r.top < innerHeight && r.width > 50; }).map(i => ({ src: i.currentSrc.split('/').pop().slice(0, 40), loading: i.getAttribute('loading'), fetchpriority: i.getAttribute('fetchpriority') }));
  out.alt = { total: imgs.length, none: imgs.filter(i => !i.hasAttribute('alt')).length, empty: imgs.filter(i => i.getAttribute('alt') === '').length };
  out.bgImages = Array.from(document.querySelectorAll('*')).filter(e => getComputedStyle(e).backgroundImage.startsWith('url(')).length;
  out.blockingScripts = Array.from(document.head.querySelectorAll('script[src]')).filter(s => !s.async && !s.defer && s.type !== 'module').map(s => s.src.split('/').pop().slice(0, 50));
  const blocks = Array.from(document.querySelectorAll('script[type="application/ld+json"]')).map(s => { try { return JSON.parse(s.textContent); } catch { return { _err: 1 }; } });
  const nodes = [], refs = [];
  const walk = o => { if (Array.isArray(o)) return o.forEach(walk); if (o && typeof o === 'object') { if (o['@type']) nodes.push({ t: [].concat(o['@type']).join('+'), id: o['@id'] || null }); const k = Object.keys(o); if (k.length === 1 && k[0] === '@id') refs.push(o['@id']); Object.values(o).forEach(walk); } };
  blocks.forEach(walk);
  const ids = new Set(nodes.filter(n => n.id).map(n => n.id)), types = {}; nodes.forEach(n => types[n.t] = (types[n.t] || 0) + 1);
  out.jsonld = { blocks: blocks.length, parseErrors: blocks.filter(b => b._err).length, types, danglingRefs: [...new Set(refs.filter(r => !ids.has(r)))] };
  const sheets = [];   // 미사용 CSS 규칙 비율(근사). PSI 수치와 같이 본다
  for (const ss of document.styleSheets) { let rules; try { rules = ss.cssRules; } catch { sheets.push({ href: (ss.href || 'inline').split('/').pop(), blocked: true }); continue; }
    let total = 0, unused = 0;
    const visit = list => { for (const r of list) { if (r.selectorText) { total++; try { if (!document.querySelector(r.selectorText.replace(/::?(before|after|placeholder|selection|hover|focus|active|visited|focus-within|focus-visible|marker|first-letter|first-line)/g, ''))) unused++; } catch {} } else if (r.cssRules) visit(r.cssRules); } };
    visit(rules); if (total > 50) sheets.push({ href: (ss.href || 'inline').split('/').pop().slice(0, 40), total, unusedPct: Math.round(unused / total * 100) }); }
  out.css = sheets.sort((a, b) => (b.total || 0) - (a.total || 0)).slice(0, 8);
  return out;
});
```
- 미사용 CSS는 페이지 3곳 이상에서 돌려 파일별로 계속 높은지 본다(예시성형외과 55번 판단 방식). 결과는 근사치라고 적는다.
- CLS 원인(새로고침 후):

```js
await site.reload();
await site.evaluate(() => { window.__cls = 0; window.__s = []; new PerformanceObserver(l => { for (const e of l.getEntries()) if (!e.hadRecentInput) { window.__cls += e.value; window.__s.push({ v: +e.value.toFixed(3), nodes: (e.sources || []).map(s => s.node && (s.node.id ? '#' + s.node.id : (typeof s.node.className === 'string' && s.node.className ? '.' + s.node.className.split(' ')[0] : s.node.nodeName))) }); } }).observe({ type: 'layout-shift', buffered: true }); });
await site.evaluate(() => window.scrollTo(0, document.body.scrollHeight)); await sleep(3000);
const cls = await site.evaluate(() => ({ cls: +window.__cls.toFixed(3), top: window.__s.sort((a, b) => b.v - a.v).slice(0, 5) }));
```

## 5. 외부 도구

- **리치 결과 테스트(구글이 실제로 가져갈 수 있는지)**: 권한 없이 된다. 403·5xx 차단 판정의 핵심 증거.

```js
var rrt = await openTab('https://search.google.com/test/rich-results?url=' + encodeURIComponent(url));
for (let i = 0; i < 24; i++) { await sleep(5000); const t = await rrt.evaluate(() => document.body.innerText); if (/테스트 결과/.test(t) && !/실제 URL 테스트 중/.test(t)) break; }
const sn = await snapshot(rrt, { interactive: true });
const m = sn.tree.match(/button "([^"]*크롤링[^"]*)" \[ref=(e\d+)\]/);
if (m) { await rrt.locator(m[2]).click(); await sleep(1000); }
const detail = await rrt.evaluate(() => { const t = document.body.innerText; const i = t.indexOf('크롤링에 사용된 에이전트'); return i >= 0 ? t.slice(i, i + 200).replace(/\n+/g, ' ') : t.slice(0, 300); });
// "페이지 가져오기 실패: 액세스 금지(403)로 인해 차단됨" → 구글 수집 불가. 대조로 정상 사이트도 한 번 돌린다.
```
- **PageSpeed Insights**: 무료 API는 공용 할당량이 자주 막힌다(429). 브라우저로 `https://pagespeed.web.dev/analysis?url=<url>&form_factor=mobile`을 열고 30~60초 기다려 본문 텍스트(LCP·CLS·TBT·인사이트·진단)를 읽는다. "실제 사용자 데이터 없음"이면 실사용자 수치가 없다는 뜻.
- **해외 접속(check-host)**: 국가별 노드에서 HTTP 상태를 준다.

```js
const r = await fetch('https://check-host.net/check-http?host=' + encodeURIComponent(url) + '&max_nodes=6', { headers: { Accept: 'application/json' } });
const { request_id } = await r.json(); await sleep(6000);
const res = await (await fetch('https://check-host.net/check-result/' + request_id, { headers: { Accept: 'application/json' } })).json();
// { "de4.node.check-host.net": [[1, 2.53, "OK", "200", ip]], "ir6...": [[0, 1.27, "Forbidden", "403", ip]] }
```
- **서브도메인 찾기(crt.sh)**: `https://crt.sh/?q=<도메인>&output=json` → name_value. 429가 자주 나서 몇 분 뒤 다시 시도. 서치콘솔 크롤링 통계의 호스트 목록이 더 확실하다.
- **W3C 검사**: `https://validator.w3.org/nu/?doc=<url>&out=json` (User-Agent 헤더 필요) → messages의 error 수.
- **Wayback**: `http://web.archive.org/cdx/search/cdx?url=<도메인>/*&output=json&fl=original,timestamp,statuscode&collapse=urlkey&limit=3000`. 느리고 시간 초과가 잦다. 한 호출에 도메인 1개.
- **site: 색인 확인**: `googleSearch`는 0건이면 파싱 오류가 난다. 탭으로 열어 "일치하는 검색결과가 없습니다 / 一致する情報は見つかりませんでした"를 확인한다.

## 6. 사이트 이전·리브랜딩 (옛 도메인)

1. 옛 도메인 찾기: 외부 정보 사이트(코네스트·강남언니·K-beauty station)의 "旧○○" 표기, 지점 목록 페이지(체인 본사 사이트), 옛 SNS 프로필 링크, 언어별 후보(`<옛이름>-jp.com`, `-tw`, `-cn`, `gangnam.<체인>.com`)를 site-probe로 확인.
2. 상태: 응답 코드, 새 사이트로 301인지, 안내 배너만 있는지, robots·noindex.
3. 구글 접근: 리치 결과 테스트(403이면 방화벽 차단), site: 검색 0건 여부.
4. 규모: 옛 사이트맵 URL 수·마지막 수정월.
5. 매핑 초안: 옛 사이트맵 URL을 새 사이트맵과 대조(시술 슬러그 일치 → 별칭 → 부분 일치 → 주제 사전 → 프로모션·의료진·소개·홈). 결과를 "바로 연결 / 검토 후 연결 / 수작업" 세 단계로 나눠 CSV로 준다. 대상 URL은 모두 실제로 열어 200·리디렉션 없음·noindex 없음을 확인한다.
6. 구글 공식 조건: 주소 변경 도구는 옛·새 속성 모두 같은 계정 소유자, 도메인 단위 속성, 다른 도메인의 하위 경로로 이동 가능, 여러 사이트는 한 곳씩, 리디렉션 최소 180일(가능하면 1년 이상).

## 7. 경쟁사 비교

- 크롤 CSV 비교: sf-summary.mjs 여러 파일.
- 사이트맵 규모·발행 속도: 위 §2 사이트맵 수집을 경쟁사 도메인에 돌려 파일별 URL 수와 lastmod 월별 분포를 센다.
- 직접 접속: 홈·상세 페이지 원본/렌더 비교(§3), JSON-LD 종류, robots(AI 봇 규칙), 언어 구조.
- 해외 SERP 등장 횟수: `scripts/keyword/serp-intent.mjs`.

## 8. 증거 이미지

- **주의: 이 REPL의 `page.screenshot({clip})`은 x·y를 무시하고 왼쪽 위(0,0)부터 자른다.** 화면 전체를 찍고 `scripts/audit/crop.py`로 자른다.

```js
// 찍을 영역을 글자로 찾아 상자 계산(가장 작은 요소들 + 공통 부모 폭)
var clipAround = async (pg, texts, pad = 12) => pg.evaluate(({ texts, pad }) => {
  const smallest = t => { let best = null; for (const el of document.querySelectorAll('body *')) { const s = el.innerText || ''; if (s.includes(t) && (!best || s.length < (best.innerText || '').length)) best = el; } return best; };
  const els = texts.map(smallest).filter(Boolean); if (!els.length) return null;
  const chain = el => { const a = []; while (el) { a.push(el); el = el.parentElement; } return a; };
  let common = chain(els[0]).find(anc => els.every(e => anc.contains(e)));
  while (common && common.getBoundingClientRect().width > innerWidth * 0.95) { const kid = Array.from(common.children).find(k => els.every(e => k.contains(e))); if (!kid) break; common = kid; }
  const rc = common.getBoundingClientRect(), rs = els.map(e => e.getBoundingClientRect());
  const top = Math.min(...rs.map(r => r.top)), bottom = Math.max(...rs.map(r => r.bottom));
  return { x: Math.max(0, rc.left - pad), y: Math.max(0, top - pad - 20), width: Math.min(innerWidth, rc.width + pad * 2), height: bottom - top + pad * 2 + 20 };
}, { texts, pad });
const box = await clipAround(pg, ['URL을 Google에 등록할 수 없음', '페이지 가져오기']);
await fs.writeFile(TMP + '/evidence/_full.png', await pg.screenshot({ type: 'png' }));
const dpr = await pg.evaluate(() => devicePixelRatio);
// Bash: python3 scripts/audit/crop.py _full.png T17-rrt-1.png --box x,y,w,h --scale <dpr> [--mask x,y,w,h]  (계정 아이콘·연락처는 --mask)
```
- 대상이 화면 밖이면 먼저 `el.scrollIntoView({block:'start'})` 후 상자를 다시 잰다.
- 화면이 없는 증거(원본 HTML·응답 헤더·리디렉션 체인)는 증거 카드로 만든다. 카드를 (0,0)에 두면 clip이 그대로 맞는다.

```js
var evidenceCard = async (pg, title, lines, out) => {
  const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');
  const html = `<!doctype html><html><head><meta charset="utf-8"><style>html,body{margin:0;background:#fff;font-family:-apple-system,'Apple SD Gothic Neo',sans-serif}#c{display:inline-block;padding:16px 20px;border:1px solid #BFBFBF;border-radius:6px;max-width:1000px}h1{font-size:15px;margin:0 0 10px;color:#1F3864}pre{margin:0;font:13px/1.55 Menlo,monospace;white-space:pre-wrap;color:#222}.m{color:#767171;font-size:11px;margin-top:10px}</style></head><body><div id="c"><h1>${esc(title)}</h1><pre>${lines.map(esc).join('\n')}</pre><div class="m">측정: ${new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' })}</div></div></body></html>`;
  await pg.goto('data:text/html;charset=utf-8,' + encodeURIComponent(html)); await sleep(600);
  const b = await pg.evaluate(() => { const r = document.getElementById('c').getBoundingClientRect(); return { width: Math.ceil(r.right) + 1, height: Math.ceil(r.bottom) + 1 }; });
  await fs.writeFile(out, await pg.screenshot({ clip: { x: 0, y: 0, ...b }, type: 'png' }));
};
```
- 네이버 SERP는 `fullPage` 캡처가 위쪽 반복으로 깨진다. 화면 단위로 찍는다.
- 이미지 확인은 `display()` 한두 장만(토큰 비용). 나머지는 크기·경로만 확인한다.
