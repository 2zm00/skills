#!/usr/bin/env node
// 검색량(네이버·구글) + 서치콘솔 검색어 + SERP 순위를 키워드 한 줄로 합친다.
// 사용: node kw-table.mjs --serp serp_google.json --ours example-clinic.com
//        [--naver naver_vol.json] [--google google_vol.json] [--gsc gsc_queries.json] [--intent intent.json] [--md out.md]
// 입력 형식
//   naver_vol.json : [{kw, pc, mo, total}]                (tool-recipes §1)
//   google_vol.json: {"키워드": {v, comp, cpc}}            (tool-recipes §2)
//   gsc_queries.json: [[검색어, 클릭, 노출, CTR, 순위], ...] (tool-recipes §5)
//   intent.json    : serp-intent.mjs --json 결과
import fs from 'fs';

const a = process.argv.slice(2); const opt = {};
for (let i = 0; i < a.length; i++) opt[a[i].replace(/^--/, '')] = a[++i];
if (!opt.serp) { console.error('usage: node kw-table.mjs --serp serp_google.json --ours domain [--naver ..] [--google ..] [--gsc ..] [--intent ..] [--md out.md]'); process.exit(1); }
const read = p => (p && fs.existsSync(p)) ? JSON.parse(fs.readFileSync(p, 'utf8')) : null;
const norm = s => String(s).replace(/\s/g, '').toLowerCase();
const num = s => parseFloat(String(s ?? '').replace(/,/g, '').replace('%', '')) || 0;
const host = u => { try { return new URL(u).host.replace(/^www\./, ''); } catch { return '?'; } };

const serp = read(opt.serp);
const naver = new Map((read(opt.naver) || []).map(r => [norm(r.kw), r.total]));
const google = new Map(Object.entries(read(opt.google) || {}).map(([k, v]) => [norm(k), v && v.v]));
const gsc = (read(opt.gsc) || []).map(r => ({ q: r[0], c: num(r[1]), i: num(r[2]), p: num(r[4]) }));
const intent = new Map(((read(opt.intent) || {}).rows || []).map(r => [r.market + '|' + r.kw, r.intent]));

const out = [];
for (const [key, list] of Object.entries(serp)) {
  if (!Array.isArray(list)) continue;
  const [market, kw] = key.includes('|') ? key.split('|') : ['-', key];
  const exact = gsc.filter(x => norm(x.q) === norm(kw));
  const near = gsc.filter(x => norm(x.q).includes(norm(kw)) && norm(x.q) !== norm(kw));
  const pos = list.findIndex(x => opt.ours && host(x.u).includes(opt.ours));
  out.push({
    market, kw,
    naver: naver.has(norm(kw)) ? naver.get(norm(kw)) : '-',
    google: google.has(norm(kw)) ? (google.get(norm(kw)) ?? '정확 행 없음') : '-',
    gscImp: exact.reduce((s, x) => s + x.i, 0), gscClk: exact.reduce((s, x) => s + x.c, 0),
    gscPos: exact.length ? +(exact.reduce((s, x) => s + x.i * x.p, 0) / Math.max(1, exact.reduce((s, x) => s + x.i, 0))).toFixed(1) : null, // 노출 가중 평균
    gscVariants: near.length ? `${near.length}개 변형 노출 ${near.reduce((s, x) => s + x.i, 0)}` : '',
    serpRank: pos < 0 ? '1페이지 밖' : pos + 1 + '위', ourUrl: pos < 0 ? '' : decodeURI(list[pos].u),
    intent: intent.get(key) || '', top3: list.slice(0, 3).map(x => host(x.u)).join(', '),
  });
}
const head = '| 시장 | 키워드 | 네이버 | 구글 | GSC 노출·클릭·순위 | 구글 현재 | 의도 | 상위 3 |\n|---|---|---|---|---|---|---|---|';
const md = [head, ...out.map(o => `| ${o.market} | ${o.kw} | ${o.naver} | ${o.google} | ${o.gscImp}·${o.gscClk}·${o.gscPos ?? '-'}${o.gscVariants ? ' (' + o.gscVariants + ')' : ''} | ${o.serpRank} | ${o.intent} | ${o.top3} |`)].join('\n');
console.log(md);
if (opt.md) fs.writeFileSync(opt.md, md);
