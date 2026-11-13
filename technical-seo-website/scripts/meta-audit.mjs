#!/usr/bin/env node
// 사이트맵의 모든 페이지를 받아 메타타이틀·H1·메타 설명·canonical·robots·구조화 데이터를 점검하고,
// 페이지끼리 같은 키워드를 겨냥하는지(겹침)를 찾는다. 로컬(next start)과 실사이트 모두 쓴다. 의존성 없음(Node 18+).
//
// 사용
//   node meta-audit.mjs http://localhost:3000            (기본: <주소>/sitemap.xml)
//   node meta-audit.mjs https://example.com --brand 예시컴퍼니 --site-url https://example.com
//   옵션: --sitemap <주소>  --brand <브랜드>  --limit 561  --max 200  --json <파일>  --include-blog
//         --site-url <운영 주소>  로컬에서 돌릴 때 canonical·사이트맵이 운영 주소를 가리키면 그 주소를 로컬로 바꿔 읽는다.
// 판정 기준: references/keyword-ia.md (제목 561px, 한 키워드는 한 페이지, 페이지당 H1 하나)

import fs from 'node:fs';

const args = process.argv.slice(2);
const opt = { limit: 561, max: 200 };
const pos = [];
for (let i = 0; i < args.length; i++) {
  const a = args[i];
  if (a === '--include-blog') opt.includeBlog = true;
  else if (a.startsWith('--')) opt[a.slice(2)] = args[++i];
  else pos.push(a);
}
if (!pos[0]) {
  console.error('사용: node meta-audit.mjs <주소> [--brand 브랜드] [--sitemap 주소] [--site-url 운영 주소] [--json 파일]');
  process.exit(1);
}
const base = pos[0].replace(/\/$/, '');
const siteUrl = (opt['site-url'] || '').replace(/\/$/, '');
const limit = Number(opt.limit);

// 제목 폭(px) 추정: scripts/keyword/title-px.mjs와 같은 계수
const W = { hangul: 16.57, cjk: 16.85, lower: 9.42, upper: 11.84, digit: 10.54, space: 5.16, punct: 9.54 };
const cls = (ch) => /[\uAC00-\uD7A3\u3130-\u318F]/.test(ch) ? 'hangul' : /[\u3040-\u30FF\u4E00-\u9FFF\uFF01-\uFF60\u3000-\u303F]/.test(ch) ? 'cjk' : /[a-z]/.test(ch) ? 'lower' : /[A-Z]/.test(ch) ? 'upper' : /[0-9]/.test(ch) ? 'digit' : ch === ' ' ? 'space' : 'punct';
const titlePx = (t) => Math.round([...t].reduce((s, ch) => s + W[cls(ch)], 0));

const decode = (s = '') => s.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#x27;|&#39;/g, "'").replace(/&nbsp;/g, ' ').replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(+n)).replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)));
const strip = (s = '') => decode(s.replace(/<script[\s\S]*?<\/script>/gi, ' ').replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim();
const toLocal = (u) => (siteUrl && u.startsWith(siteUrl) ? base + u.slice(siteUrl.length) : u);
const norm = (u) => { try { const x = new URL(u); return (x.origin + x.pathname).replace(/\/$/, ''); } catch { return u; } };

async function get(url) {
  const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 (compatible; meta-audit)' }, redirect: 'follow' });
  return { status: res.status, url: res.url, redirected: res.redirected, text: await res.text() };
}

async function sitemapUrls(url, depth = 0) {
  const r = await get(toLocal(url));
  if (r.status !== 200) { console.error(`사이트맵 ${url} 응답 ${r.status}`); return []; }
  const locs = [...r.text.matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/g)].map((m) => decode(m[1]));
  if (/<sitemapindex/i.test(r.text) && depth < 2) {
    const out = [];
    for (const child of locs) out.push(...(await sitemapUrls(child, depth + 1)));
    return out;
  }
  return locs;
}

function meta(html, name) {
  const re = new RegExp(`<meta[^>]+(?:name|property)=["']${name}["'][^>]*>`, 'i');
  const tag = html.match(re)?.[0];
  return tag ? decode(tag.match(/content=["']([^"']*)["']/i)?.[1] ?? '') : null;
}

function jsonLdTypes(html) {
  const types = new Set();
  let faqQ = 0;
  for (const m of html.matchAll(/<script[^>]+application\/ld\+json[^>]*>([\s\S]*?)<\/script>/gi)) {
    try {
      const walk = (n) => {
        if (Array.isArray(n)) return n.forEach(walk);
        if (n && typeof n === 'object') {
          const t = n['@type'];
          if (t) (Array.isArray(t) ? t : [t]).forEach((x) => types.add(x));
          if (t === 'FAQPage' && Array.isArray(n.mainEntity)) faqQ += n.mainEntity.length;
          Object.values(n).forEach(walk);
        }
      };
      walk(JSON.parse(m[1]));
    } catch { types.add('(JSON 오류)'); }
  }
  return { types: [...types], faqQ };
}

function audit(url, r) {
  const html = r.text;
  const title = decode(html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] ?? '').trim();
  const h1s = [...html.matchAll(/<h1[^>]*>([\s\S]*?)<\/h1>/gi)].map((m) => strip(m[1]));
  const canonical = decode(html.match(/<link[^>]+rel=["']canonical["'][^>]*>/i)?.[0]?.match(/href=["']([^"']+)["']/i)?.[1] ?? '');
  const robots = meta(html, 'robots');
  const desc = meta(html, 'description');
  const ogImage = meta(html, 'og:image');
  const { types, faqQ } = jsonLdTypes(html);
  return { url, status: r.status, finalUrl: r.url, title, px: title ? titlePx(title) : 0, h1s, desc, canonical, robots, ogImage, types, faqQ };
}

// 스타터(assets/starter)의 자리표시 문구. 운영 페이지에 남으면 안 된다.
const PLACEHOLDER = /키워드[1-3]|브랜드명|검색한 사람이 얻는 것|무엇의 숫자인지|회사·서비스 이름|슬로건 대신 무엇을 하는 회사인지|example\.com/g;

// 메타타이틀 → 키워드 슬롯 ("A · B · C | 브랜드")
const slotsOf = (title) => title.split('|')[0].split(/\s*[·,]\s*/).map((s) => s.trim()).filter(Boolean);
const key = (s) => s.replace(/\s+/g, '').toLowerCase();

(async () => {
  let urls = await sitemapUrls(opt.sitemap || `${base}/sitemap.xml`);
  if (!opt.includeBlog) urls = urls.filter((u) => !/\/blog\//.test(new URL(u).pathname + '/'));
  urls = [...new Set(urls)].slice(0, Number(opt.max));
  if (!urls.length) { console.error('사이트맵에서 주소를 찾지 못했다.'); process.exit(1); }

  const pages = [];
  for (let i = 0; i < urls.length; i += 4) {
    const batch = urls.slice(i, i + 4);
    pages.push(...(await Promise.all(batch.map(async (u) => audit(u, await get(toLocal(u)))))));
  }

  const issues = [];
  const add = (sev, page, msg) => issues.push({ sev, page, msg });
  const path = (u) => { try { return new URL(u).pathname; } catch { return u; } };

  for (const p of pages) {
    const where = path(p.url);
    if (p.status !== 200) { add('높음', where, `응답 ${p.status} (사이트맵에 있는데 열리지 않음)`); continue; }
    if (p.redirected) add('중간', where, `사이트맵 주소가 리디렉션됨 → ${p.finalUrl}`);
    if (!p.title) add('높음', where, '제목 없음');
    else {
      if (p.px > limit) add('중간', where, `제목 ${p.px}px (${limit}px 초과): ${p.title}`);
      if (opt.brand && !p.title.includes(opt.brand)) add('낮음', where, `제목에 브랜드(${opt.brand}) 없음`);
      const slots = slotsOf(p.title);
      const dup = slots.filter((s, i) => slots.findIndex((x) => key(x) === key(s)) !== i);
      if (dup.length) add('중간', where, `제목 안 같은 키워드 반복: ${dup.join(', ')}`);
    }
    if (p.h1s.length !== 1) add(p.h1s.length ? '중간' : '높음', where, `H1 ${p.h1s.length}개`);
    if (!p.desc) add('중간', where, '메타 설명 없음');
    else if ([...p.desc].length < 40) add('낮음', where, `메타 설명이 짧음(${[...p.desc].length}자)`);
    else if ([...p.desc].length > 160) add('낮음', where, `메타 설명이 김(${[...p.desc].length}자, 잘릴 수 있음)`);
    if (!p.canonical) add('높음', where, 'canonical 없음');
    else if (norm(toLocal(p.canonical)) !== norm(toLocal(p.url))) add('높음', where, `canonical이 다른 주소: ${p.canonical}`);
    if (p.robots && /noindex/i.test(p.robots)) add('높음', where, `robots에 noindex: ${p.robots}`);
    if (!p.types.length) add('중간', where, '구조화 데이터 없음');
    else if (where !== '/' && !p.types.includes('BreadcrumbList')) add('낮음', where, 'BreadcrumbList 없음');
    if (!p.ogImage) add('낮음', where, 'og:image 없음');
    const leftovers = [p.title, p.desc, p.h1s.join(' '), p.canonical].join(' ').match(PLACEHOLDER);
    if (leftovers) add('높음', where, `스타터 자리표시가 남음: ${[...new Set(leftovers)].join(', ')}`);
  }

  // 페이지 사이 중복·겹침
  const live = pages.filter((p) => p.status === 200);
  const group = (fn) => { const m = new Map(); for (const p of live) { const k = fn(p); if (k) m.set(k, [...(m.get(k) || []), path(p.url)]); } return [...m].filter(([, v]) => v.length > 1); };
  for (const [t, ps] of group((p) => p.title)) add('높음', ps.join(', '), `같은 제목: ${t}`);
  for (const [d, ps] of group((p) => p.desc)) add('중간', ps.join(', '), `같은 메타 설명: ${d.slice(0, 40)}…`);
  for (const [h, ps] of group((p) => p.h1s[0])) add('중간', ps.join(', '), `같은 H1: ${h}`);
  const owners = new Map();
  for (const p of live) for (const s of slotsOf(p.title)) { if (opt.brand && key(s) === key(opt.brand)) continue; owners.set(key(s), [...(owners.get(key(s)) || []), { s, page: path(p.url) }]); }
  for (const [, list] of owners) if (list.length > 1) add('중간', list.map((x) => x.page).join(', '), `키워드 겹침: "${list[0].s}"를 여러 페이지 제목이 겨냥`);
  // 부분 겹침: 한 페이지의 키워드가 다른 페이지 키워드 안에 들어 있음(예: 병원마케팅 ⊂ 병원마케팅 사례). 의도한 사례 페이지면 무시.
  const all = [...owners].map(([k, list]) => ({ k, s: list[0].s, pages: [...new Set(list.map((x) => x.page))] }));
  for (const a1 of all) for (const b1 of all) {
    if (a1 === b1 || a1.k.length < 3 || !b1.k.includes(a1.k) || a1.k === b1.k) continue;
    const other = b1.pages.filter((x) => !a1.pages.includes(x));
    if (other.length) add('낮음', `${a1.pages.join(', ')} ↔ ${other.join(', ')}`, `부분 겹침: "${a1.s}" ⊂ "${b1.s}" (사례·상세 페이지면 의도한 것인지 확인)`);
  }

  // 출력
  console.log(`# 메타 점검: ${base} (${new Date().toISOString().slice(0, 10)}, ${pages.length}쪽)\n`);
  console.log('| 경로 | 제목 | px | H1 | 설명 | canonical | 구조화 데이터 |');
  console.log('|---|---|---|---|---|---|---|');
  for (const p of pages) {
    const canOk = p.canonical && norm(toLocal(p.canonical)) === norm(toLocal(p.url)) ? '정상' : (p.canonical ? '다름' : '없음');
    console.log(`| ${path(p.url)} | ${p.title.replace(/\|/g, '\\|')} | ${p.px} | ${(p.h1s[0] || '-').slice(0, 30)}${p.h1s.length > 1 ? ` (+${p.h1s.length - 1})` : ''} | ${p.desc ? [...p.desc].length + '자' : '없음'} | ${canOk} | ${p.types.filter((t) => !['ListItem', 'Question', 'Answer', 'ImageObject', 'Person', 'ContactPoint', 'SearchAction'].includes(t)).join(', ')}${p.faqQ ? ` (FAQ ${p.faqQ})` : ''} |`);
  }
  const order = { 높음: 0, 중간: 1, 낮음: 2 };
  issues.sort((a, b) => order[a.sev] - order[b.sev]);
  console.log(`\n## 문제 후보 (${issues.length}건)\n`);
  if (!issues.length) console.log('- 없음');
  for (const i of issues) console.log(`- [${i.sev}] ${i.page}: ${i.msg}`);
  if (opt.json) fs.writeFileSync(opt.json, JSON.stringify({ base, pages, issues }, null, 1));
})().catch((e) => { console.error(e); process.exit(1); });
