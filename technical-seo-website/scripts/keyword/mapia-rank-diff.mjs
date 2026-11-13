#!/usr/bin/env node
// 마피아넷 블로그 순위 CSV(엑셀 다운로드, 전체 기록 누적) -> 최신일 vs 직전일 변동 요약 JSON.
// 사용: node mapia-rank-diff.mjs <csv> [--drop 3] [--days 7]
//   drop: 이만큼 이상 움직이면 하락/상승으로 표시(기본 3). days: 최신일과 N일 전(그날 기록이 없으면 그 이전 가장 가까운 날)을 비교, 0이면 직전 확인일(기본 7).
// 출력: 대상 블로그별 키워드 수, 최신 확인일, 1페이지(1~10위) 수, 하락/상승/신규 진입/이탈 목록만.
import fs from 'fs';
const [file, ...rest] = process.argv.slice(2);
const arg = (n, d) => { const i = rest.indexOf(n); return i < 0 ? d : Number(rest[i + 1]); };
const dropTh = arg('--drop', 3), backDays = arg('--days', 7);
const minus = (d, n) => { if (!/^\d{4}\.\d{2}\.\d{2}$/.test(d)) return ''; const t = new Date(d.replace(/\./g, '-') + 'T00:00:00Z'); t.setUTCDate(t.getUTCDate() - n); return t.toISOString().slice(0, 10).replace(/-/g, '.'); };
if (!file) { console.error('usage: node mapia-rank-diff.mjs <csv> [--drop 3]'); process.exit(1); }
const txt = fs.readFileSync(file, 'utf8').replace(/^\uFEFF/, '');
const parse = line => { const out = []; let cur = '', q = false;
  for (let i = 0; i < line.length; i++) { const c = line[i];
    if (q) { if (c === '"' && line[i + 1] === '"') { cur += '"'; i++; } else if (c === '"') q = false; else cur += c; }
    else if (c === '"') q = true; else if (c === ',') { out.push(cur); cur = ''; } else cur += c; }
  out.push(cur); return out; };
const lines = txt.split(/\r?\n/).filter(Boolean); const head = parse(lines[0]);
const ix = n => head.indexOf(n);
const I = { t: ix('추적 대상'), k: ix('키워드'), d: ix('확인일'), best: ix('최고 순위'), st: ix('상태'), url: ix('글 링크') };
const rank = s => { const m = String(s).match(/(\d+)\s*위/); return m ? +m[1] : null; }; // null = 30위 밖/미노출
const day = s => String(s).slice(0, 10);
const series = new Map(); // target|kw -> Map(day -> rec)  (같은 날 여러 번이면 마지막 기록)
for (const l of lines.slice(1)) { const f = parse(l); const key0 = f[I.t] + '|' + f[I.k];
  if (!/^\d{4}\.\d{2}\.\d{2}/.test(f[I.d] || '')) { if (!series.has(key0)) series.set(key0, new Map()); continue; } // 아직 첫 확인 전
  const key = f[I.t] + '|' + f[I.k];
  if (!series.has(key)) series.set(key, new Map());
  series.get(key).set(day(f[I.d]), { r: rank(f[I.best]), st: f[I.st], url: f[I.url] }); }
const res = {};
for (const [key, m] of series) { const [target, kw] = key.split('|');
  const days = [...m.keys()].sort();
  if (!days.length) { const t0 = res[target] ??= { 키워드수: 0, 최신확인일: '', 일페이지: 0, 하락: [], 상승: [], 신규진입: [], 이탈: [], 미노출: [] }; t0.키워드수++; (t0.확인전 ??= []).push(kw); continue; }
  const last = days.at(-1); const prev = backDays ? days.filter(d => d <= minus(last, backDays)).at(-1) : days.at(-2);
  const a = m.get(last), b = prev ? m.get(prev) : null;
  const t = res[target] ??= { 키워드수: 0, 최신확인일: '', 일페이지: 0, 하락: [], 상승: [], 신규진입: [], 이탈: [], 미노출: [] };
  t.키워드수++; if (last > t.최신확인일) t.최신확인일 = last; if (a.r && a.r <= 10) t.일페이지++;
  const row = { kw, 지금: a.r, 직전: b?.r ?? null, 비교일: prev ?? null, 글: a.url || null };
  if (!a.r) { (b?.r ? t.이탈 : t.미노출).push(row); continue; }
  if (!b) { (t.신규등록 ??= []).push(row); continue; }
  if (!b.r) { t.신규진입.push(row); continue; }
  if (a.r - b.r >= dropTh) t.하락.push(row); else if (b.r - a.r >= dropTh) t.상승.push(row);
}
for (const t of Object.values(res)) { t.하락.sort((x, y) => (y.지금 - y.직전) - (x.지금 - x.직전)); t.상승.sort((x, y) => (y.직전 - y.지금) - (x.직전 - x.지금)); }
console.log(JSON.stringify({ 파일: file.split('/').at(-1), 행수: lines.length - 1, 기준: `${backDays ? backDays + '일 전' : '직전 확인일'} 대비 ${dropTh}계단 이상 변동, 직전 기록 없으면 신규 등록`, 대상: res }, null, 1));
