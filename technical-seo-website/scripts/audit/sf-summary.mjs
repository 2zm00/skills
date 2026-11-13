#!/usr/bin/env node
// 스크리밍프로그 "Internal - All" CSV 요약. 여러 파일을 주면 사이트 비교표도 만든다.
// 사용: node sf-summary.mjs <csv> [<csv> ...] [--names 예시피부과,경쟁사A] [--detail "/procedure/[^/]+/?$,/treatments/[^/]+$"] [--json out.json]
//   --detail : 사이트별 상세 템플릿(시술·상품 페이지) URL 정규식. 순서는 csv 순서와 같다. 없으면 상세 통계 생략.
// 원본 행은 출력하지 않는다. 숫자와 상위 사례만 낸다.
import fs from 'fs';
import path from 'path';

export function parseCsv(file) {
  const raw = fs.readFileSync(file, 'utf8').replace(/^\uFEFF/, '');
  const rows = []; let row = [], f = '', q = false;
  for (let i = 0; i < raw.length; i++) { const c = raw[i];
    if (q) { if (c === '"') { if (raw[i + 1] === '"') { f += '"'; i++; } else q = false; } else f += c; }
    else if (c === '"') q = true; else if (c === ',') { row.push(f); f = ''; }
    else if (c === '\n') { row.push(f.replace(/\r$/, '')); rows.push(row); row = []; f = ''; } else f += c; }
  if (f || row.length) { row.push(f); rows.push(row); }
  const H = rows[0];
  return rows.slice(1).filter(r => r.length > 5).map(r => Object.fromEntries(H.map((h, i) => [h, r[i] ?? ''])));
}

const n = x => parseFloat(x) || 0;
const med = a => { const v = a.filter(x => !isNaN(x)).sort((x, y) => x - y); return v.length ? v[Math.floor(v.length / 2)] : null; };
const pct = (a, b) => b ? Math.round(a / b * 100) + '%' : '-';
const dc = u => { try { return decodeURI(u); } catch { return u; } };
const count = (arr, fn) => { const o = {}; for (const x of arr) { const k = fn(x); o[k] = (o[k] || 0) + 1; } return Object.entries(o).sort((a, b) => b[1] - a[1]); };

export function summarize(D, detailRe) {
  const html = D.filter(r => /text\/html/.test(r['Content Type']));
  const ok = html.filter(r => r['Status Code'] === '200');
  const idx = ok.filter(r => r.Indexability === 'Indexable');
  const titles = count(idx, r => r['Title 1']).filter(x => x[1] > 1 && x[0]);
  const descs = count(idx.filter(r => r['Meta Description 1']), r => r['Meta Description 1']).filter(x => x[1] > 1);
  const hash = count(ok.filter(r => r.Hash), r => r.Hash).filter(x => x[1] > 1);
  const redirects = html.filter(r => /^3/.test(r['Status Code'])).map(r => ({ url: dc(r.Address), to: dc(r['Redirect URL']), code: r['Status Code'], inlinks: n(r['Unique Inlinks']) })).sort((a, b) => b.inlinks - a.inlinks);
  const folder = count(html, r => { try { const u = new URL(r.Address); const p = u.pathname.split('/').filter(Boolean); return u.host + '/' + p.slice(0, 2).map(s => s.length > 24 ? '*' : s).join('/') + (p.length > 2 ? '/…' : '') + (u.search ? '?' : ''); } catch { return '?'; } });
  const det = detailRe ? idx.filter(r => detailRe.test(r.Address)) : [];
  const s = {
    rows: D.length, html: html.length,
    contentTypes: count(D, r => (r['Content Type'] || '-').split(';')[0]).slice(0, 8),
    status: count(html, r => r['Status Code']), indexability: count(html, r => r.Indexability + (r['Indexability Status'] ? ':' + r['Indexability Status'] : '')),
    languages: count(ok, r => r.Language || '-').slice(0, 8),
    respMedianSec: med(ok.map(r => n(r['Response Time']))), respOver1s: ok.filter(r => n(r['Response Time']) > 1).length,
    htmlKBMedian: Math.round((med(ok.map(r => n(r['Size (Bytes)']))) || 0) / 1024), over2MB: ok.filter(r => n(r['Size (Bytes)']) > 2 * 1024 * 1024).map(r => dc(r.Address)).slice(0, 10),
    title: { missing: idx.filter(r => !r['Title 1']).length, dupGroups: titles.length, dupTop: titles.slice(0, 5), pxMedian: med(idx.map(r => n(r['Title 1 Pixel Width']))), over561: idx.filter(r => n(r['Title 1 Pixel Width']) > 561).length, over561Pct: pct(idx.filter(r => n(r['Title 1 Pixel Width']) > 561).length, idx.length) },
    description: { missing: idx.filter(r => !r['Meta Description 1']).length, dupGroups: descs.length, over990px: idx.filter(r => n(r['Meta Description 1 Pixel Width']) > 990).length },
    h1: { missing: idx.filter(r => !r['H1-1']).length, multiple: idx.filter(r => r['H1-2']).length, h2FirstTop: count(idx, r => r['H2-1']).slice(0, 3) },
    canonical: { missing: idx.filter(r => !r['Canonical Link Element 1']).length, nonSelf: idx.filter(r => r['Canonical Link Element 1'] && r['Canonical Link Element 1'] !== r.Address).length, canonicalisedTo: count(html.filter(r => r['Indexability Status'] === 'Canonicalised'), r => dc(r['Canonical Link Element 1'])).slice(0, 5) },
    metaRobots: count(html, r => r['Meta Robots 1'] || '(없음)').slice(0, 6),
    words: { median: med(idx.map(r => n(r['Word Count']))), under300: idx.filter(r => n(r['Word Count']) < 300).length },
    depth: count(ok, r => r['Crawl Depth']),
    inlinksMedian: med(idx.map(r => n(r['Unique Inlinks']))), lowInlinks: idx.filter(r => n(r['Unique Inlinks']) <= 1).map(r => dc(r.Address)).slice(0, 10),
    redirectsInternal: { count: redirects.length, top: redirects.slice(0, 12) },
    nonOk: html.filter(r => !/^[23]/.test(r['Status Code'])).map(r => r['Status Code'] + ' ' + dc(r.Address)).slice(0, 15),
    exactDuplicates: hash.length, paramUrls: html.filter(r => /\?/.test(r.Address)).map(r => dc(r.Address)).slice(0, 8), paramCount: html.filter(r => /\?/.test(r.Address)).length,
    folders: folder.slice(0, 20),
    largeAssets: D.filter(r => !/text\/html/.test(r['Content Type'])).sort((a, b) => n(b['Size (Bytes)']) - n(a['Size (Bytes)'])).slice(0, 8).map(r => Math.round(n(r['Size (Bytes)']) / 1024) + 'KB ' + dc(r.Address)),
  };
  if (detailRe) s.detail = { pattern: String(detailRe), count: det.length, wordsMedian: med(det.map(r => n(r['Word Count']))), under300: pct(det.filter(r => n(r['Word Count']) < 300).length, det.length), titlePxMedian: med(det.map(r => n(r['Title 1 Pixel Width']))), inlinksMedian: med(det.map(r => n(r['Unique Inlinks']))), h1Median: med(det.map(r => n(r['H1-1 Length']))), sample: det.slice(0, 6).map(r => `${dc(new URL(r.Address).pathname)} || ${r['Title 1']} || H1:${r['H1-1']} || ${r['Word Count']}단어`) };
  return s;
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === path.resolve(new URL(import.meta.url).pathname);
if (isMain) {
  const a = process.argv.slice(2); const files = []; let names = null, details = null, json = null;
  for (let i = 0; i < a.length; i++) { if (a[i] === '--names') names = a[++i].split(','); else if (a[i] === '--detail') details = a[++i].split(','); else if (a[i] === '--json') json = a[++i]; else files.push(a[i]); }
  if (!files.length) { console.error('usage: node sf-summary.mjs <csv...> [--names a,b] [--detail re1,re2] [--json out.json]'); process.exit(1); }
  const out = {};
  files.forEach((f, i) => { const name = names?.[i] || path.basename(f); out[name] = summarize(parseCsv(f), details?.[i] ? new RegExp(details[i]) : null); });
  if (files.length === 1) console.log(JSON.stringify(out, null, 1));
  else {
    const keys = [['HTML 수', s => s.html], ['응답 중간값(초)', s => s.respMedianSec], ['HTML 중간값(KB)', s => s.htmlKBMedian], ['제목 폭 중간값(px)', s => s.title.pxMedian], ['제목 561px 초과', s => s.title.over561Pct], ['제목 중복 그룹', s => s.title.dupGroups], ['설명 누락', s => s.description.missing], ['H1 누락', s => s.h1.missing], ['canonical 누락', s => s.canonical.missing], ['내부 리디렉션 URL', s => s.redirectsInternal.count], ['파라미터 URL', s => s.paramCount], ['단어 중간값', s => s.words.median], ['상세 페이지 단어 중간값', s => s.detail?.wordsMedian ?? '-'], ['상세 300단어 미만', s => s.detail?.under300 ?? '-'], ['상세 인링크 중간값', s => s.detail?.inlinksMedian ?? '-']];
    const names2 = Object.keys(out);
    console.log('| 항목 | ' + names2.join(' | ') + ' |\n|---|' + names2.map(() => '---').join('|') + '|');
    for (const [label, fn] of keys) console.log(`| ${label} | ${names2.map(k => fn(out[k]) ?? '-').join(' | ')} |`);
  }
  if (json) fs.writeFileSync(json, JSON.stringify(out, null, 1));
}
