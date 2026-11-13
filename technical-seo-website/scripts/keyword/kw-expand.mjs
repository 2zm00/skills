// 큰 키워드(헤드) → 미들·롱테일 후보 넓히기 (2026-11-08 대표 지시 "메인 키워드가 몇만이면 미들테일·롱테일·관련검색어로 조사해서 검색량 맞춘 다음에 써도 된다").
// 네이버 자동완성 2단계(헤드 → 자동완성 → 각 자동완성의 자동완성) + 질문형 접미어. 로그인 불필요. 검색량은 이 목록을 마피아넷에 넣어 잰다.
// 사용: node kw-expand.mjs "클로드 코드" "사업자등록증" [--depth 2] [--max 60]  → JSON {head: [{kw, src}]}
const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : d; };
const heads = args.filter((a, i) => !a.startsWith('--') && !['--depth', '--max'].includes(args[i - 1]));
const DEPTH = +opt('--depth', 2), MAX = +opt('--max', 60);
const UA = { 'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/130 Safari/537.36' };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function ac(q) {
  const u = 'https://ac.search.naver.com/nx/ac?' + new URLSearchParams({ q, con: '1', frm: 'nv', ans: '2', r_format: 'json', r_enc: 'UTF-8', r_unicode: '0', t_koreng: '1', run: '2', rev: '4', q_enc: 'UTF-8', st: '100' });
  try { const j = await (await fetch(u, { headers: UA })).json(); await sleep(250); return (j.items?.[0] || []).map((x) => x[0]); } catch { return []; }
}
const SUFFIX = ['방법', '비용', '가격', '뜻', '차이', '추천', '후기', '신청', '조건', '기간', '하는법', '서류', '무료'];
const out = {};
for (const h of heads) {
  const seen = new Map(); const addK = (k, src) => { k = k.trim(); if (k && k !== h && !seen.has(k)) seen.set(k, src); };
  const l1 = await ac(h); l1.forEach((k) => addK(k, '자동완성'));
  for (const s of SUFFIX) (await ac(`${h} ${s}`)).forEach((k) => addK(k, `자동완성(${s})`));
  if (DEPTH >= 2) for (const k of l1.slice(0, 8)) (await ac(k)).forEach((x) => addK(x, `자동완성2(${k})`));
  out[h] = [...seen].slice(0, MAX).map(([kw, src]) => ({ kw, src }));
}
console.log(JSON.stringify(out, null, 1));
