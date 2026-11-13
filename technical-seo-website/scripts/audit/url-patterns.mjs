#!/usr/bin/env node
// URL 목록을 유형·경로 패턴별로 묶는다. 서치콘솔 색인 사유별 URL(드릴다운 500개), 사이트맵, 크롤 목록에 쓴다.
// 입력: 텍스트(한 줄에 URL 하나) 또는 JSON. JSON은 [[url, ...], ...] / [url, ...] / {키: {title, rows:[[url,...]]}} 모두 받는다.
// 사용: node url-patterns.mjs index_reasons.json [--sitemap sitemap_urls.json] [--top 12]
//   --sitemap : [[파일, url, lastmod], ...] 또는 [url, ...]. 사유별로 사이트맵 제출 URL과 겹치는 수를 센다.
import fs from 'fs';

const a = process.argv.slice(2);
if (!a[0]) { console.error('usage: node url-patterns.mjs <file> [--sitemap file] [--top 12]'); process.exit(1); }
const opt = { top: 12, sitemap: null };
for (let i = 1; i < a.length; i++) opt[a[i].replace(/^--/, '')] = a[++i];
const dc = u => { try { return decodeURI(u); } catch { return u; } };
const norm = u => dc(u).replace(/\/$/, '');

function load(file) {
  const t = fs.readFileSync(file, 'utf8');
  try {
    const j = JSON.parse(t);
    if (Array.isArray(j)) return { '전체': j.map(r => Array.isArray(r) ? r.find(x => /^https?:/.test(x)) : r).filter(Boolean) };
    const out = {}; for (const [k, v] of Object.entries(j)) { const rows = v.rows || v; out[v.title || k] = rows.map(r => Array.isArray(r) ? r[0] : r).filter(x => /^https?:/.test(x)); } return out;
  } catch { return { '전체': t.split('\n').map(s => s.trim()).filter(s => /^https?:/.test(s)) }; }
}

export function kind(u) {
  let x; try { x = new URL(u); } catch { return '잘못된 URL'; }
  const p = dc(x.pathname);
  if (/\/feed\/?$|\/rss|\.xml$/.test(p)) return '피드·사이트맵';
  if (/wp-json|wp-includes|wp-content|wp-admin|\/_next\/|\/static\/|\.(js|css|png|jpe?g|webp|svg|woff2?)$/i.test(p)) return '리소스·시스템';
  if (/\/(category|tag|author|procedurecategory|portfolio-category)\//.test(p)) return '분류 페이지';
  if (/\/page\/\d+/.test(p) || x.searchParams.has('page')) return '페이지 번호';
  if (['q', 's', 'search', 'keyword', 'query'].some(k => x.searchParams.has(k))) return '사이트 내 검색';
  if (['returnUrl', 'redirect', 'login'].some(k => x.searchParams.has(k)) || /\/login/.test(p)) return '로그인';
  if ([...x.searchParams.keys()].some(k => /^utm_|^igsh|^fbclid|^gclid|^n_|^aeo/.test(k))) return '추적 파라미터';
  if (x.search) return '기타 파라미터';
  if (p === '/' || /^\/[a-z]{2}(-[a-zA-Z]{2,4})?\/?$/.test(p)) return '홈·언어 홈';
  return '콘텐츠';
}
const pattern = u => { try { const x = new URL(u); const s = x.pathname.split('/').filter(Boolean); const lang = /^[a-z]{2}(-[a-zA-Z]{2,4})?$/.test(s[0] || '') ? s[0] + '/' : ''; const rest = lang ? s.slice(1) : s; return x.host + '/' + lang + (rest[0] ? (rest[0].length > 24 ? '*' : rest[0]) : '') + (rest.length > 1 ? '/…' : '') + (x.search ? ' ?' + [...x.searchParams.keys()].join('&') : ''); } catch { return '?'; } };

const groups = load(a[0]);
let sm = null;
if (opt.sitemap) { const j = JSON.parse(fs.readFileSync(opt.sitemap, 'utf8')); sm = new Set(j.map(r => norm(Array.isArray(r) ? r.find(x => /^https?:/.test(x)) : r))); }
for (const [name, urls] of Object.entries(groups)) {
  const k = {}; const pt = {}; const ex = {};
  for (const u of urls) { const t = kind(u); k[t] = (k[t] || 0) + 1; (ex[t] = ex[t] || []).push(dc(u)); const p = pattern(u); pt[p] = (pt[p] || 0) + 1; }
  console.log(`\n## ${name} (${urls.length})`);
  console.log('유형: ' + Object.entries(k).sort((a, b) => b[1] - a[1]).map(([t, c]) => `${t} ${c}`).join(' · '));
  if (sm) console.log(`사이트맵 제출 URL과 겹침: ${urls.filter(u => sm.has(norm(u))).length}`);
  console.log('경로 패턴 상위:'); for (const [p, c] of Object.entries(pt).sort((a, b) => b[1] - a[1]).slice(0, +opt.top)) console.log(`  ${c}  ${dc(p)}`);
  if (ex['콘텐츠']) console.log('콘텐츠 예: ' + ex['콘텐츠'].slice(0, 4).join('  '));
}
