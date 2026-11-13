# 도구 사용 레시피 (REPL, 2026-10 실사용 코드)

> 이 문서의 JS 코드는 **Aside 브라우저 REPL 전용**이다(openTab·snapshot·fs·googleSearch). Claude Code·Claude 앱에서는 검색량은 `scripts/keyword/volumes.mjs`, 서치콘솔·SERP 화면은 사용자에게 CSV·캡처로 받는다.

모든 결과는 `TMP`(세션 tmp 폴더)에 JSON으로 바로 저장한다. REPL 변수는 중간에 사라질 수 있다.

```js
var TMP = '<세션 tmp 절대경로>';
```

## 1. 네이버 검색량: ma-pia.net

```js
var mp = await openTab('https://ma-pia.net/keyword/keyword.php');
const kws = ['강남 피부과','강남 울쎄라'].map(k => k.replace(/\s/g,''));   // 붙여쓰기, 최대 100개
await mp.locator('textarea').first().fill(kws.join('\n'));
await mp.getByRole('button', { name: '조회하기' }).click();
await sleep(4000);
const nv = await mp.evaluate(() => Array.from(document.querySelectorAll('table tbody tr'))
  .map(tr => Array.from(tr.querySelectorAll('td')).map(td => td.innerText.trim()).filter(Boolean))
  .filter(r => /^\d+$/.test(r[0]))
  .map(r => ({ kw: r[1].split('\n')[0], pc: r[2], mo: r[3], total: r[4] })));
await fs.writeFile(TMP + '/naver_vol.json', JSON.stringify(nv));
```

- 두 번째 묶음을 같은 탭에서 조회하면 이전 표가 남는다. `초기화` 버튼을 먼저 누른다.
- 띄어쓴 키워드가 섞이면 빈 표가 나올 때가 있다. 붙여쓰기로 넣는다.
- 0은 "10 미만"이다. 네이버가 막는 키워드(예: 플레이스상위노출)도 0으로 나온다.

## 2. 구글 검색량: keyword-analyzer-topaz (한국·일본만)

페이지 안에서 앱의 API를 4개씩 병렬로 부르고 결과를 `window.__kv`에 쌓은 뒤 REPL에서 기다린다. 한 번에 많이 부르면 CDP 타임아웃이 난다.

```js
var tz = await openTab('https://keyword-analyzer-topaz.vercel.app/');
const jobs = [['강남 피부과','korea'], ['江南 美容クリニック','japan']];   // location: 'korea' | 'japan'
await tz.evaluate((jobs) => {
  window.__kv = {}; const q = jobs.slice();
  const work = async () => { while (q.length) { const [keyword, location] = q.shift();
    try { const r = await fetch('/api/keywords', { method:'POST', headers:{'content-type':'application/json'},
            body: JSON.stringify({ keyword, location, limit: 50, tab: 'suggestions' }) });
          const j = await r.json();
          const row = (j.keywords||[]).find(x => x.keyword.replace(/\s/g,'').toLowerCase() === keyword.replace(/\s/g,'').toLowerCase());
          window.__kv[keyword] = row ? { v: row.search_volume, comp: row.competition_level, cpc: row.cpc }
                                     : { v: null, related: (j.keywords||[]).slice(0,3).map(x => x.keyword+':'+x.search_volume) };
    } catch (e) { window.__kv[keyword] = { err: e.message }; } } };
  for (let i = 0; i < 4; i++) work();
}, jobs);
for (let i = 0; i < 24; i++) { const n = await tz.evaluate(() => Object.keys(window.__kv).length); if (n >= jobs.length) break; await sleep(5000); }
await fs.writeFile(TMP + '/google_vol.json', JSON.stringify(await tz.evaluate(() => window.__kv)));
```

- `location`에 'taiwan' 등을 넣으면 400("korea 또는 japan")이 난다.
- 정확히 같은 행이 없으면 `v:null`로 두고 관련 키워드만 참고로 적는다(헤더의 Seed Volume은 쓰지 않는다).
- SERP+AI 개요(한국·일본, 1회 약 1원): `POST /api/serp {keyword, location}` → `organic_results[{rank_group,domain,url,title}]`, `has_ai_overview`, `ai_overview.markdown`. 1회 20~60초라 한 REPL 호출에 1~2개만.

## 3. 구글 SERP: 시장별

```js
const LOC = { ko:{language:'ko',country:'kr'}, ja:{language:'ja',country:'jp'}, tw:{language:'zh-TW',country:'tw'}, en:{language:'en',country:'us'} };
var serp = {}; try { serp = JSON.parse(await fs.readFile(TMP+'/serp_google.json','utf8')); } catch {}
for (const [lang, q] of [['ja','韓国 リフトアップ'], ['tw','江南 醫美']]) {
  if (serp[lang+'|'+q]) continue;
  try { const r = await googleSearch.search(q, { limit: 10, ...LOC[lang] }); serp[lang+'|'+q] = r.map(x => ({ t: x.title, u: x.url })); }
  catch (e) { serp[lang+'|'+q] = { err: e.message }; }
  await fs.writeFile(TMP+'/serp_google.json', JSON.stringify(serp));
}
```

- 30초당 6회 제한이 자동으로 걸린다. 한 REPL 호출에 7개 안팎.
- 결과가 0건이면 파싱 오류가 난다(`site:` 검색에서 흔함). 그때는 탭으로 `https://www.google.com/search?q=site%3A도메인&hl=ja&gl=jp`를 열고 "一致する情報は見つかりませんでした / 일치하는 검색결과가 없습니다"를 확인한다.
- 국내 IP에서 국가·언어를 지정한 결과다. 현지 결과와 다를 수 있다고 보고에 적는다.

## 4. 네이버 SERP

네이버 탭 하나를 열어 두고 그 안에서 fetch로 HTML을 받아 분석한다(키워드당 0.5초 안팎). 탭을 연 직후 바로 부르면 CDP 타임아웃이 나므로 2~3초 기다린 뒤 시작한다. 우리 도메인이 보이면 광고 블록인지 확인한다.

```js
var nvTab = await openTab('https://search.naver.com/search.naver?query=test');
await sleep(2500);
const naverSerp = async (q, domainRe) => nvTab.evaluate(async ({ q, src }) => {
  const re = new RegExp(src);
  const t = await (await fetch('/search.naver?where=nexearch&query=' + encodeURIComponent(q))).text();
  const d = new DOMParser().parseFromString(t, 'text/html');
  const heads = [...new Set(Array.from(d.querySelectorAll('h2')).map(h => h.textContent.trim().replace(/\s+/g,' ')).filter(x => x && x.length < 30))];
  const hosts = []; for (const a of d.querySelectorAll('a[href^="http"]')) { try { const h = new URL(a.href).host.replace('www.',''); if (!/naver|pstatic|navercorp/.test(h) && !hosts.includes(h)) hosts.push(h); } catch {} }
  const mine = Array.from(d.querySelectorAll('a[href]')).filter(a => re.test(a.href));
  return { q, heads, hosts: hosts.slice(0, 12), ours: mine.length > 0, webBlock: heads.some(h => /웹사이트/.test(h)) };
}, { q, src: domainRe.source });
```

- 우리 도메인이 있으면 실제 페이지를 열어 그 링크의 가장 가까운 상위 `h2`를 찾는다. "관련 광고"면 자연 노출이 아니다.

```js
await nvTab.goto('https://search.naver.com/search.naver?where=nexearch&query=' + encodeURIComponent('강남 리프팅'));
const sec = await nvTab.evaluate(() => { const a = Array.from(document.querySelectorAll('a')).find(a => /example-clinic\.com/.test(a.href));
  let p = a, h = null; for (let i = 0; p && !h && i < 25; i++) { p = p.parentElement; h = p && p.querySelector('h2'); } return h && h.textContent.trim(); });
```

- 웹문서 탭: `&ssc=tab.web.all`. 자동완성: `https://ac.search.naver.com/nx/ac?q=<키워드>&st=100&r_format=json&q_enc=UTF-8&r_enc=UTF-8`.
- `screenshot({fullPage:true})`는 네이버에서 위쪽이 반복 캡처된다. 증거는 영역 clip으로 찍는다.

## 5. 서치콘솔 검색어·페이지·국가 표

```js
var gsc = await openTab('https://search.google.com/search-console/performance/search-analytics?resource_id=sc-domain%3A<도메인>&hl=ko&metrics=CLICKS%2CIMPRESSIONS%2CCTR%2CPOSITION');
// 16개월: &num_of_months=16 (데이터가 있는 기간만 나온다)
const s = await snapshot(gsc, { interactive: true });
const lb = s.tree.match(/listbox "페이지당 행 수" \[ref=(e\d+)\]/)[1];
await gsc.locator(lb).click(); await sleep(600);
await gsc.getByRole('option', { name: '500', exact: true }).click(); await sleep(2500);
const rows = await gsc.evaluate(() => { const p = Array.from(document.querySelectorAll('[role="tabpanel"]')).find(x => x.offsetParent !== null);
  return Array.from(p.querySelectorAll('table tbody tr')).map(tr => Array.from(tr.querySelectorAll('td')).map(td => td.innerText.trim()).filter(Boolean)); });
await fs.writeFile(TMP + '/gsc_queries.json', JSON.stringify(rows));   // [검색어, 클릭, 노출, CTR, 순위]
```

- 탭 전환: `gsc.getByRole('tab', { name: '페이지', exact: true }).click()` 후 같은 방식(국가·기기·일).
- 옵션 클릭이 안 먹으면 옵션 좌표를 구해 `gsc.mouse.click(x,y)`로 누른다. 파란 도움말 팝업("확인")이 페이지 화살표를 가릴 수 있다.
- 페이지 URL 셀에는 "클립보드에 URL 복사…" 글자가 붙는다. `split(' ')[0]`으로 자른다.
- 브랜드 검색어 정규식을 먼저 정하고(옛 이름 포함) 브랜드·비브랜드를 나눠 본다.

## 6. 경쟁사 제목 패턴

`serp_google.json`에서 상위 6개 제목을 키워드별로 뽑아 지역·서비스 위치, 수식어, 길이를 본다. 크롤 CSV가 있으면 `scripts/audit/sf-summary.mjs`로 제목 길이·시술 페이지 분량을 비교한다.
