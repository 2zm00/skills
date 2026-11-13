#!/usr/bin/env node
// 구글 SERP 저장본으로 키워드별 검색 의도와 경쟁 도메인을 집계한다.
// 입력 형식: {"<시장>|<키워드>": [{"t": 제목, "u": URL}, ...]}  (tool-recipes.md §3)
// 사용: node serp-intent.mjs serp_google.json --ours example-clinic.com [--brand "예시피부과|エグザンプル"] [--top 8] [--json out.json]
import fs from 'fs';

const args = process.argv.slice(2);
if (!args[0]) { console.error('usage: node serp-intent.mjs serp_google.json --ours domain [--brand regex] [--top 8] [--json out.json]'); process.exit(1); }
const opt = { ours: null, brand: null, top: 8, json: null };
for (let i = 1; i < args.length; i++) { const k = args[i].replace(/^--/, ''); opt[k] = args[++i]; }
opt.top = +opt.top;

// 도메인 유형 사전. 새 시장·업종이면 여기에 추가한다.
const TYPES = {
  platform: /modoodoc|my-doctor|unni\.app|gangnamunni|creatrip|konest|goodoc|yeoshin|cashdoc|doctorsfile|caloo|hotpepper|tribeau|klook|hanchao|k-beautystation|medieus|soyiyuan|tripadvisor|trip\.com|kmong|wanted|saramin|jobkorea/i,
  community: /threads\.(com|net)|reddit|instagram|facebook|youtube|tiktok|x\.com|twitter|dcard|note\.com|daangn|ameblo|pf\.kakao|kin\.naver|cafe\.naver|ptt\.cc/i,
  media: /blog|brunch|tistory|velog|medium|harpersbazaar|allure|vogue|elle|bbc|cnn|biteki|izzychou|tpshow|nuyoublog|kimbeauty|mionni|atpress|news|press|times|mk\.co\.kr|hankyung|chosun|joongang|donga/i,
  public: /\.go\.kr|\.or\.kr|\.gov|mhlw|wikipedia|namu\.wiki|wiki/i,
};
const host = u => { try { return new URL(u).host.replace(/^www\./, ''); } catch { return '?'; } };
const typeOf = (h) => {
  if (opt.ours && h.includes(opt.ours)) return 'ours';
  for (const [t, re] of Object.entries(TYPES)) if (re.test(h)) return t;
  return 'business';
};

const serp = JSON.parse(fs.readFileSync(args[0], 'utf8'));
const rows = [];
const comp = {};
for (const [key, list] of Object.entries(serp)) {
  if (!Array.isArray(list)) continue;
  const [market, kw] = key.includes('|') ? key.split('|') : ['-', key];
  const top = list.slice(0, opt.top);
  const c = { business: 0, platform: 0, community: 0, media: 0, public: 0, ours: 0 };
  top.forEach(x => c[typeOf(host(x.u))]++);
  const ourPos = list.findIndex(x => opt.ours && host(x.u).includes(opt.ours));
  const isBrand = opt.brand ? new RegExp(opt.brand, 'i').test(kw) : false;
  let intent;
  if (isBrand && ourPos === 0) intent = '이동(브랜드)';
  else if (c.public >= 4) intent = '목록·정의(공공·위키)';
  else if (c.business + c.ours >= 5) intent = '업체 직접 경쟁';
  else if (c.platform >= 4) intent = '비교·추천(플랫폼)';
  else if (c.community >= 3) intent = '경험·후기(커뮤니티)';
  else if (c.platform + c.community + c.media >= 4) intent = '비교·후기 탐색';
  else intent = '혼합';
  rows.push({ market, kw, ...c, ourRank: ourPos < 0 ? null : ourPos + 1, intent, top3: list.slice(0, 3).map(x => host(x.u)) });
  list.forEach((x, i) => { const h = host(x.u); if (typeOf(h) !== 'business') return; comp[h] = comp[h] || { n: 0, best: 99, markets: new Set() }; comp[h].n++; comp[h].best = Math.min(comp[h].best, i + 1); comp[h].markets.add(market); });
}

for (const r of rows) console.log(`${r.market} | ${r.kw} | 업체${r.business} 플랫폼${r.platform} 커뮤${r.community} 미디어${r.media} 공공${r.public} | 우리 ${r.ourRank ?? '밖'} | ${r.intent} | ${r.top3.join(', ')}`);
console.log('\n경쟁 업체 도메인 (2회 이상 등장):');
const compList = Object.entries(comp).filter(([, v]) => v.n >= 2).sort((a, b) => b[1].n - a[1].n);
for (const [h, v] of compList) console.log(`${h} ${v.n}회 최고 ${v.best}위 [${[...v.markets].join(',')}]`);
if (opt.json) fs.writeFileSync(opt.json, JSON.stringify({ rows, competitors: compList.map(([h, v]) => ({ domain: h, n: v.n, best: v.best, markets: [...v.markets] })) }, null, 1));
