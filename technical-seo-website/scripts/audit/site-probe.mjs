#!/usr/bin/env node
// URL 목록의 원본 응답을 점검한다 (방화벽이 없는 사이트용. 403이 나오면 recipes.md §3 브라우저 방식으로).
// 사용: node site-probe.mjs <url...> | --file urls.txt  [--ua mobile|desktop|googlebot] [--variants] [--soft404] [--json out.json]
//   --variants : 각 호스트의 http/https · www/non-www · 끝 슬래시 변형을 함께 요청
//   --soft404  : 각 호스트에 없는 주소를 요청해 상태 코드 확인
import fs from 'fs';

const UA = {
  mobile: 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Mobile Safari/537.36',
  desktop: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36',
  googlebot: 'Mozilla/5.0 (Linux; Android 6.0.1; Nexus 5X Build/MMB29P) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.7390.122 Mobile Safari/537.36 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
};
const args = process.argv.slice(2);
const opt = { ua: 'mobile', variants: false, soft404: false, json: null };
let urls = [];
for (let i = 0; i < args.length; i++) {
  const a = args[i];
  if (a === '--file') urls.push(...fs.readFileSync(args[++i], 'utf8').split('\n').map(s => s.trim()).filter(Boolean));
  else if (a === '--ua') opt.ua = args[++i];
  else if (a === '--json') opt.json = args[++i];
  else if (a === '--variants') opt.variants = true;
  else if (a === '--soft404') opt.soft404 = true;
  else urls.push(a);
}
if (!urls.length) { console.error('usage: node site-probe.mjs <url...> [--file urls.txt] [--ua mobile|desktop|googlebot] [--variants] [--soft404] [--json out.json]'); process.exit(1); }

async function chain(url, max = 10) {
  const hops = []; let cur = url; const t0 = Date.now(); let ttfb = null; let res;
  for (let i = 0; i < max; i++) {
    const s = Date.now();
    try { res = await fetch(cur, { redirect: 'manual', headers: { 'User-Agent': UA[opt.ua] || opt.ua, 'Accept': 'text/html,application/xhtml+xml', 'Accept-Language': 'ko-KR,ko;q=0.9,en;q=0.8' } }); }
    catch (e) { hops.push({ url: cur, err: e.cause?.code || e.message }); return { hops, res: null, ms: Date.now() - t0 }; }
    if (ttfb === null || i > 0) ttfb = Date.now() - s;
    const loc = res.headers.get('location');
    hops.push({ url: cur, status: res.status, location: loc || undefined });
    if (res.status >= 300 && res.status < 400 && loc) { cur = new URL(loc, cur).href; continue; }
    break;
  }
  return { hops, res, ttfb, ms: Date.now() - t0 };
}

const ENT = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', ndash: '–', mdash: '—', hellip: '…', middot: '·', lsquo: '‘', rsquo: '’', ldquo: '“', rdquo: '”', laquo: '«', raquo: '»', copy: '©', reg: '®', trade: '™' };
const dec = (s) => s == null ? s : s.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (all, k) => k[0] === '#' ? String.fromCodePoint(k[1].toLowerCase() === 'x' ? parseInt(k.slice(2), 16) : parseInt(k.slice(1), 10)) : (ENT[k.toLowerCase()] ?? all));

function parseHtml(html) {
  const m = (re) => (html.match(re) || [])[1];
  const all = (re) => Array.from(html.matchAll(re)).map(x => x[1]);
  const headEnd = html.search(/<\/head>/i); const head = headEnd > 0 ? html.slice(0, headEnd) : html; const body = headEnd > 0 ? html.slice(headEnd) : '';
  const ld = all(/<script[^>]+application\/ld\+json[^>]*>([\s\S]*?)<\/script>/gi);
  const types = []; for (const b of ld) for (const t of b.matchAll(/"@type"\s*:\s*"([^"]+)"/g)) types.push(t[1]);
  const text = html.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/gi, ' ').replace(/<[^>]+>/g, ' ').replace(/&[a-z#0-9]+;/gi, ' ').replace(/\s+/g, ' ').trim();
  return {
    doctype: /^\s*<!doctype html/i.test(html),
    lang: m(/<html[^>]*\slang=["']([^"']+)/i) || null,
    charset: m(/<meta[^>]+charset=["']?([\w-]+)/i) || null,
    title: dec((m(/<title[^>]*>([\s\S]*?)<\/title>/i) || '').trim()) || null,
    description: dec(m(/<meta[^>]+name=["']description["'][^>]*content=["']([^"']*)/i) ?? null),
    robots: m(/<meta[^>]+name=["']robots["'][^>]*content=["']([^"']*)/i) || null,
    canonical: m(/<link[^>]+rel=["']canonical["'][^>]*href=["']([^"']*)/i) || null,
    hreflang: all(/<link[^>]+hreflang=["']([^"']+)["']/gi),
    viewport: m(/<meta[^>]+name=["']viewport["'][^>]*content=["']([^"']*)/i) || null,
    ogTitle: dec(m(/<meta[^>]+property=["']og:title["'][^>]*content=["']([^"']*)/i)) || null,
    h: Object.fromEntries([1, 2, 3, 4, 5, 6].map(n => ['h' + n, (html.match(new RegExp('<h' + n + '[\\s>]', 'gi')) || []).length])),
    h1: all(/<h1[^>]*>([\s\S]*?)<\/h1>/gi).map(s => dec(s.replace(/<[^>]+>/g, '').trim())).slice(0, 3),
    jsonldBlocks: ld.length, jsonldTypes: [...new Set(types)],
    metaInBody: (body.match(/<(meta|link)[^>]+(name=["'](robots|description)["']|rel=["'](canonical|alternate)["'])/gi) || []).length,
    headInvalid: (head.match(/<(img|iframe|div|p|span)[\s>]/gi) || []).length,
    imgs: (html.match(/<img\s/gi) || []).length, imgNoAlt: (html.match(/<img(?![^>]*\salt=)[^>]*>/gi) || []).length,
    blockingScripts: (head.match(/<script(?![^>]*\b(async|defer)\b)(?![^>]*type=["']module)[^>]*\ssrc=/gi) || []).length,
    words: text.split(' ').length, textChars: text.length,
  };
}

async function probe(url) {
  const c = await chain(url);
  const r = { url, hops: c.hops, ttfbMs: c.ttfb, totalMs: c.ms };
  if (!c.res) return r;
  const h = c.res.headers;
  r.finalUrl = c.hops[c.hops.length - 1].url; r.status = c.res.status;
  r.headers = { 'content-type': h.get('content-type'), 'content-encoding': h.get('content-encoding'), 'x-robots-tag': h.get('x-robots-tag'), vary: h.get('vary'), 'cache-control': h.get('cache-control'), server: h.get('server'), 'cf-ray': h.get('cf-ray') ? 'yes' : null };
  const buf = Buffer.from(await c.res.arrayBuffer()); r.bytes = buf.length; r.over2MB = buf.length > 2 * 1024 * 1024;
  if (/html/.test(h.get('content-type') || '')) Object.assign(r, parseHtml(buf.toString('utf8')));
  if (r.status === 403) r.hint = '403: 방화벽이 일반 요청을 막는 중. 브라우저 방식(recipes §3)과 리치 결과 테스트(recipes §6)로 다시 확인';
  return r;
}

const results = [];
for (const u of urls) results.push(await probe(u));
const hosts = [...new Set(urls.map(u => new URL(u).host))];
const extra = {};
if (opt.variants) {
  extra.variants = [];
  for (const host of hosts) {
    const bare = host.replace(/^www\./, '');
    for (const v of [`http://${bare}/`, `https://${bare}/`, `http://www.${bare}/`, `https://www.${bare}/`]) { const c = await chain(v); extra.variants.push({ request: v, hops: c.hops.map(x => x.status ?? x.err).join(' → '), final: c.hops[c.hops.length - 1].url }); }
    const sample = urls.find(u => new URL(u).host === host && /\/[^/]+\/$/.test(new URL(u).pathname));
    if (sample) { const noSlash = sample.replace(/\/$/, ''); const c = await chain(noSlash); extra.variants.push({ request: noSlash, hops: c.hops.map(x => x.status ?? x.err).join(' → '), final: c.hops[c.hops.length - 1].url }); }
  }
}
if (opt.soft404) {
  extra.soft404 = [];
  for (const host of hosts) { const u = `https://${host}/this-page-should-not-exist-${Date.now()}`; const c = await chain(u); extra.soft404.push({ request: u, status: c.hops.map(x => x.status ?? x.err).join(' → '), verdict: !c.res ? '요청 실패' : c.res.status === 200 ? '소프트 404 의심(200 응답)' : [404, 410].includes(c.res.status) ? '정상(404/410)' : `확인 필요(${c.res.status})` }); }
}
for (const r of results) {
  console.log(`\n${r.url}\n  체인: ${r.hops.map(x => (x.status ?? x.err) + (x.location ? ' →' : '')).join(' ')}  최종 ${r.finalUrl || '-'}  TTFB ${r.ttfbMs ?? '-'}ms  크기 ${r.bytes ?? '-'}B${r.over2MB ? ' (2MB 초과)' : ''}`);
  if (r.title !== undefined) console.log(`  title: ${r.title}\n  desc: ${(r.description || '(없음)').slice(0, 80)}\n  robots: ${r.robots || '-'} / X-Robots: ${r.headers['x-robots-tag'] || '-'}  canonical: ${r.canonical || '(없음)'}\n  hreflang ${r.hreflang.length}개  h1 ${r.h.h1}개 ${JSON.stringify(r.h1)}  JSON-LD ${r.jsonldBlocks}블록 ${r.jsonldTypes.slice(0, 8).join(',')}\n  body 안 메타 ${r.metaInBody}  head 무효 요소 ${r.headInvalid}  차단 스크립트 ${r.blockingScripts}  img ${r.imgs}(alt 없음 ${r.imgNoAlt})  단어 ${r.words}  압축 ${r.headers['content-encoding'] || '-'}  lang ${r.lang} charset ${r.charset}`);
  if (r.hint) console.log('  ' + r.hint);
}
if (extra.variants) { console.log('\n[URL 변형]'); for (const v of extra.variants) console.log(`  ${v.request} : ${v.hops} → ${v.final}`); }
if (extra.soft404) { console.log('\n[소프트 404]'); for (const v of extra.soft404) console.log(`  ${v.request} : ${v.status} ${v.verdict}`); }
if (opt.json) fs.writeFileSync(opt.json, JSON.stringify({ results, ...extra }, null, 1));
