#!/usr/bin/env node
// 브라우저 없이 검색량 조회: 네이버(마피아넷) + 구글 한국·일본(keyword-analyzer-topaz).
// Aside Bash, Claude Code(터미널)에서 동작. Claude 앱(claude.ai)은 외부 접속이 막혀 있을 수 있다.
//
// 사용
//   node volumes.mjs --naver "강남 울쎄라,강남 리쥬란" --kr "강남 피부과" --jp "江南 美容クリニック" --out <dir>
//   node volumes.mjs --file kws.txt --out <dir>      (kws.txt 한 줄에 하나: "naver|키워드", "kr|키워드", "jp|키워드")
// 출력 (kw-table.mjs 입력 형식과 같음)
//   <dir>/naver_vol.json  [{kw, pc, mo, total, comp}]   네이버 0은 "10 미만"
//   <dir>/google_vol.json {"키워드": {v, comp, cpc, loc}}  정확히 같은 행이 없으면 v:null + related
// 대만·영어권 등은 topaz가 지원하지 않는다(400 "korea 또는 japan").
import fs from 'fs';
import path from 'path';

const args = process.argv.slice(2); const opt = {};
for (let i = 0; i < args.length; i++) opt[args[i].replace(/^--/, '')] = args[++i];
const split = s => (s || '').split(',').map(x => x.trim()).filter(Boolean);
const jobs = { naver: split(opt.naver), kr: split(opt.kr), jp: split(opt.jp) };
if (opt.file) for (const line of fs.readFileSync(opt.file, 'utf8').split(/\r?\n/)) {
  const m = line.match(/^\s*(naver|kr|jp)\s*\|\s*(.+?)\s*$/i); if (m) jobs[m[1].toLowerCase()].push(m[2]);
}
if (!opt.out || !(jobs.naver.length + jobs.kr.length + jobs.jp.length)) {
  console.error('usage: node volumes.mjs [--naver "a,b"] [--kr "a,b"] [--jp "a,b"] [--file kws.txt] --out <dir>'); process.exit(1);
}
fs.mkdirSync(opt.out, { recursive: true });
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126 Safari/537.36';
const norm = s => String(s).replace(/\s+/g, '').toLowerCase();
const num = v => { const n = parseInt(String(v).replace(/[^\d]/g, ''), 10); return Number.isNaN(n) ? null : n; };

async function naver(list) {
  const out = [];
  const uniq = [...new Set(list.map(k => k.replace(/\s+/g, '')))];
  for (let i = 0; i < uniq.length; i += 100) {
    const batch = uniq.slice(i, i + 100);
    const r = await fetch('https://ma-pia.net/keyword/keywordQ.php', {
      method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded; charset=UTF-8', 'user-agent': UA, referer: 'https://ma-pia.net/keyword/keyword.php' },
      body: 'DataQ=' + encodeURIComponent(batch.join(',')), signal: AbortSignal.timeout(60000),
    });
    const t = (await r.text()).replace(/^\s*success\s*:\s*/, '');
    const got = new Map();
    for (const rec of t.split('|||').map(s => s.trim()).filter(Boolean)) {
      const f = rec.split('///');
      const pc = num(f[1]), mo = num(f[2]);
      got.set(norm(f[0]), { kw: f[0], pc, mo, total: pc == null || mo == null ? null : pc + mo, comp: f[7] || null });
    }
    for (const k of batch) out.push(got.get(norm(k)) || { kw: k, pc: null, mo: null, total: null, comp: null, note: '응답 없음' });
  }
  return out;
}

async function google(list, loc) {
  const res = {}; const q = [...new Set(list)];
  const work = async () => { while (q.length) { const keyword = q.shift();
    try {
      const r = await fetch('https://keyword-analyzer-topaz.vercel.app/api/keywords', {
        method: 'POST', headers: { 'content-type': 'application/json', 'user-agent': UA },
        body: JSON.stringify({ keyword, location: loc, limit: 50, tab: 'suggestions' }), signal: AbortSignal.timeout(90000),
      });
      const j = await r.json();
      const rows = j.keywords || [];
      const row = rows.find(x => norm(x.keyword) === norm(keyword));
      res[keyword] = row ? { v: row.search_volume, comp: row.competition_level ?? null, cpc: row.cpc ?? null, loc }
        : { v: null, loc, related: rows.slice(0, 3).map(x => `${x.keyword}:${x.search_volume}`), err: j.error || undefined };
    } catch (e) { res[keyword] = { v: null, loc, err: e.message }; }
  } };
  await Promise.all(Array.from({ length: Math.min(4, q.length) }, work));
  return res;
}

const nv = jobs.naver.length ? await naver(jobs.naver) : [];
const gv = { ...(jobs.kr.length ? await google(jobs.kr, 'korea') : {}), ...(jobs.jp.length ? await google(jobs.jp, 'japan') : {}) };
if (nv.length) fs.writeFileSync(path.join(opt.out, 'naver_vol.json'), JSON.stringify(nv, null, 1));
if (Object.keys(gv).length) fs.writeFileSync(path.join(opt.out, 'google_vol.json'), JSON.stringify(gv, null, 1));
const day = new Date().toISOString().slice(0, 10);
console.log(`조회일 ${day}`);
for (const x of nv) console.log(`네이버\t${x.kw}\t${x.total ?? '-'}\t(PC ${x.pc ?? '-'} / MO ${x.mo ?? '-'})\t${x.comp ?? ''}`);
for (const [k, x] of Object.entries(gv)) console.log(`구글 ${x.loc === 'korea' ? '한국' : '일본'}\t${k}\t${x.v ?? '-'}${x.v == null ? '\t정확히 같은 행 없음 ' + (x.related || []).join(', ') + (x.err ? ' ' + x.err : '') : ''}`);
