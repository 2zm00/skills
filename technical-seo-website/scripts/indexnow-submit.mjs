#!/usr/bin/env node
// 사이트맵의 주소 전체를 IndexNow(빙·네이버·IndexNow 공용 창구)에 제출한다. 런칭 직후와 큰 변경 배포 뒤에 쓴다.
// 의존성 없음(Node 18+).
//
// 사용
//   node indexnow-submit.mjs --host example.com --key <32자 키>
//   옵션: --sitemap <주소,주소>  기본은 robots.txt의 Sitemap 줄, 없으면 https://<host>/sitemap.xml
//         --urls <파일>          한 줄에 주소 하나 (사이트맵 대신)
//         --dry                  제출하지 않고 주소만 센다
// 응답: 200·202 정상, 403 키 불일치, 422 다른 도메인 주소 포함·키 파일 없음, 429 너무 잦음.

import fs from 'node:fs';

const args = process.argv.slice(2);
const opt = {};
for (let i = 0; i < args.length; i++) {
  if (args[i] === '--dry') opt.dry = true;
  else if (args[i].startsWith('--')) opt[args[i].slice(2)] = args[++i];
}
if (!opt.host || !opt.key) { console.error('사용: node indexnow-submit.mjs --host 도메인 --key 키 [--sitemap 주소] [--urls 파일] [--dry]'); process.exit(1); }
const origin = `https://${opt.host}`;
const ENDPOINTS = ['https://api.indexnow.org/indexnow', 'https://www.bing.com/indexnow', 'https://searchadvisor.naver.com/indexnow'];

async function text(url) { const r = await fetch(url, { headers: { 'User-Agent': 'indexnow-submit' } }); return { status: r.status, body: await r.text() }; }
async function fromSitemap(url, depth = 0) {
  const r = await text(url);
  if (r.status !== 200) { console.error(`사이트맵 ${url} 응답 ${r.status}`); return []; }
  const locs = [...r.body.matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/g)].map((m) => m[1].replace(/&amp;/g, '&'));
  if (/<sitemapindex/i.test(r.body) && depth < 2) { const out = []; for (const c of locs) out.push(...(await fromSitemap(c, depth + 1))); return out; }
  return locs;
}

(async () => {
  let urls = [];
  if (opt.urls) urls = fs.readFileSync(opt.urls, 'utf8').split('\n').map((s) => s.trim()).filter(Boolean);
  else {
    let sitemaps = opt.sitemap ? opt.sitemap.split(',') : [];
    if (!sitemaps.length) { const robots = await text(`${origin}/robots.txt`); sitemaps = [...robots.body.matchAll(/^\s*Sitemap:\s*(\S+)/gim)].map((m) => m[1]); }
    if (!sitemaps.length) sitemaps = [`${origin}/sitemap.xml`];
    for (const s of sitemaps) urls.push(...(await fromSitemap(s.trim())));
  }
  urls = [...new Set(urls)].filter((u) => { try { return new URL(u).hostname === opt.host; } catch { return false; } });
  console.log(`제출할 주소 ${urls.length}개 (${opt.host})`);
  if (!urls.length) process.exit(1);

  const keyFile = await text(`${origin}/${opt.key}.txt`);
  if (keyFile.status !== 200 || keyFile.body.trim() !== opt.key) console.log(`주의: 키 파일 ${origin}/${opt.key}.txt 응답 ${keyFile.status}, 내용 불일치면 403·422가 난다.`);
  if (opt.dry) { urls.forEach((u) => console.log(' ', u)); return; }

  const body = JSON.stringify({ host: opt.host, key: opt.key, keyLocation: `${origin}/${opt.key}.txt`, urlList: urls.slice(0, 10000) });
  for (const ep of ENDPOINTS) {
    try {
      const r = await fetch(ep, { method: 'POST', headers: { 'Content-Type': 'application/json; charset=utf-8' }, body });
      const t = (await r.text()).slice(0, 120);
      console.log(`${[200, 202].includes(r.status) ? '✓' : '✗'} ${ep} → ${r.status}${t ? ' ' + t : ''}`);
    } catch (e) { console.log(`✗ ${ep} → ${e.message}`); }
  }
})().catch((e) => { console.error(e); process.exit(1); });
