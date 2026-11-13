#!/usr/bin/env node
// 홈페이지 문구 검사: TSX 하드코딩 문구, AI 말투(규칙 75개 중 홈페이지에 맞는 것), 금지 표현, 구어, 용어 불일치, 해요체 혼입.
// 기준: references/copy-design.md. 의존성 없음(Node 18+).
//
// 사용
//   node copy-lint.mjs <프로젝트 폴더>                 (src/ 아래 .ts/.tsx 전부)
//   옵션: --terms terms.json   용어 표 추가·덮어쓰기 {"틀린 말": "맞는 말"}
//         --max 20             분류마다 보여 줄 예시 수
//         --json <파일>        전체 결과 저장
// 메타타이틀처럼 "A · B | 브랜드" 꼴인 문자열은 붙여쓰기 키워드라 용어 검사에서 뺀다.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const { RULES } = await import(path.join(here, 'lib', 'ai-tells-rules.mjs'));

const args = process.argv.slice(2);
const opt = { max: 20 };
const pos = [];
for (let i = 0; i < args.length; i++) (args[i].startsWith('--') ? (opt[args[i].slice(2)] = args[++i]) : pos.push(args[i]));
if (!pos[0]) { console.error('사용: node copy-lint.mjs <프로젝트 폴더> [--terms terms.json] [--max 20] [--json 파일]'); process.exit(1); }
const root = path.resolve(pos[0]);
const srcRoot = fs.existsSync(path.join(root, 'src')) ? path.join(root, 'src') : root;

const HANGUL = /[가-힣]/;
const files = [];
(function walk(d) {
  for (const f of fs.readdirSync(d)) {
    if (['node_modules', '.next', '.git', 'out', 'public'].includes(f)) continue;
    const p = path.join(d, f);
    const st = fs.statSync(p);
    if (st.isDirectory()) walk(p);
    else if (/\.(ts|tsx)$/.test(f) && !f.endsWith('.d.ts')) files.push(p);
  }
})(srcRoot);

// 문자열·주석을 구분해 읽는다. 문자열 토큰과, 문자열·주석을 지운 코드(JSX 텍스트 찾기용)를 돌려준다.
function scan(src) {
  const strings = [];
  let code = '';
  let i = 0, line = 1;
  const push = (text, ln, prev) => { if (HANGUL.test(text)) strings.push({ text, line: ln, prev }); };
  while (i < src.length) {
    const c = src[i], n = src[i + 1];
    if (c === '/' && n === '/') { while (i < src.length && src[i] !== '\n') { code += ' '; i++; } continue; }
    if (c === '/' && n === '*') { i += 2; code += '  '; while (i < src.length && !(src[i] === '*' && src[i + 1] === '/')) { if (src[i] === '\n') { line++; code += '\n'; } else code += ' '; i++; } i += 2; code += '  '; continue; }
    if (c === '"' || c === "'") {
      const q = c, start = line, before = code.slice(-60); let s = ''; i++; code += ' ';
      while (i < src.length && src[i] !== q && src[i] !== '\n') { if (src[i] === '\\') { s += src[i + 1]; i += 2; code += '  '; continue; } s += src[i]; i++; code += ' '; }
      i++; code += ' '; push(s, start, before); continue;
    }
    if (c === '`') {
      const start = line, before = code.slice(-60); let s = ''; i++; code += ' ';
      while (i < src.length && src[i] !== '`') {
        if (src[i] === '\\') { s += src[i + 1]; i += 2; code += '  '; continue; }
        if (src[i] === '$' && src[i + 1] === '{') { let depth = 1; i += 2; code += '  '; s += ' '; while (i < src.length && depth) { if (src[i] === '{') depth++; else if (src[i] === '}') depth--; if (src[i] === '\n') { line++; code += '\n'; } else code += ' '; i++; } continue; }
        if (src[i] === '\n') { line++; code += '\n'; } else code += ' ';
        s += src[i]; i++;
      }
      i++; code += ' '; push(s.trim(), start, before); continue;
    }
    if (c === '\n') line++;
    code += c; i++;
  }
  return { strings, code };
}

function jsxTexts(code) {
  const out = [];
  // 문자열·주석을 지운 코드에 남은 한글은 JSX 텍스트뿐이다. {표현식} 옆에 붙은 텍스트("출처: {x}")도 잡는다.
  const re = /([^<>{}\n]*[가-힣][^<>{}\n]*)/g;
  let m;
  while ((m = re.exec(code))) out.push({ text: m[1].replace(/\s+/g, ' ').trim(), line: code.slice(0, m.index).split('\n').length });
  return out;
}

// 금지·주의 표현 (copy-design.md 2장)
const BANNED = [
  [/혁신적/u, '근거 숫자·범위로'],
  [/같이\s?돕/u, '~합니다, 맡습니다'],
  [/단순히[^.]{0,30}아니라/u, '바로 결론'],
  [/하는\s?순간/u, '바로 결론'],
  [/결론적으로|따라서,|또한,/u, '접속사 빼기'],
  [/완벽한|최고의|No\.?\s?1|넘버원|유일한/u, '근거 숫자로(의료는 최상급 금지)'],
  [/—/u, '쉼표·문장 분리'],
  [/(?:도|면|는|가|이|게)\s0(?=$|[\s.,)!?])/u, "'0' 대신 '제로'"],
];
const COLLOQUIAL = [
  [/손님이 오는 길/u, '고객 여정'], [/받쳐\s?주는/u, '서포트'], [/먼저 하는 채널/u, '핵심 채널'],
  [/어디서 새는|단계가 새면|새는지/u, '이탈 지점·이탈하면'], [/한 벌로/u, '하나로 통일'], [/온도가/u, '문의의 질'],
  [/덜어\s?냅/u, '줄입니다'], [/퍼뜨립/u, '확산합니다'], [/핸드오프/u, '일을 넘기는 단계'], [/바닥이고|바닥입니다/u, '기반'],
];
let TERMS = { '기술 SEO': '테크니컬 SEO', '메타광고': '메타 광고', '진료 과목': '진료과목', '진료 시간': '진료시간' };
if (opt.terms) TERMS = { ...TERMS, ...JSON.parse(fs.readFileSync(opt.terms, 'utf8')) };
// 스타터(assets/starter) 자리표시. 운영 코드에 남으면 안 된다.
// 어디에 있어도 잡는 고유 문구 + 문자열 전체가 같을 때만 잡는 일반 문구("서비스 이름이나 지역…" 같은 실제 문장 오탐 방지)
const PLACEHOLDER = /키워드[1-3]|브랜드명|검색한 사람이 얻는 것|무엇의 숫자인지|회사·서비스 이름|슬로건 대신 무엇을 하는 회사인지|근거가 되는 사실 한두 가지|구조화 데이터 문장은 같아야/u;
const PLACEHOLDER_EXACT = /^(서비스 이름|한 줄 설명)$/u;
// 문자열 바로 앞 코드가 접근성 속성이면 "접근성 라벨"로 분류한다 (aria-label="…", alt={…? "…"}, ariaLabel="…")
const A11Y_PREV = /(aria-[a-z]+|\balt|ariaLabel|aria-label)=\{?[^}"'`=]*$/;
const ACRONYM = /^(?:[A-Z0-9]{1,5}(?:[·\s/&+-]+|$))+$/;
const JOURNEY_OK = /(고객|구매|사용자|소비자|환자)\s?여정|담당자의\s?여정/u;
// 합니다체 사이트에서도 안내 문구의 요청형(입력해 주세요, 확인해 보세요)은 쓴다
const REQUEST_OK = /(주세요|보세요|하세요|마세요)[.!]?$/u;
const AI_RULES = RULES.filter((r) => !/^[SF]/.test(r.id) && r.id !== 'R09');
const HEYO = RULES.find((r) => r.id === 'S02');

const hits = {};
const add = (cat, file, line, match, text, note = '') => (hits[cat] ||= []).push({ file: path.relative(root, file), line, match, text: text.slice(0, 90), note });
const isTitleLike = (t) => /\s·\s/.test(t) && /\|/.test(t);
const isQuote = (t) => /^[“"'「『]/.test(t.trim()) || /[”"'」』]$/.test(t.trim());

for (const f of files) {
  const src = fs.readFileSync(f, 'utf8');
  const { strings, code } = scan(src);
  const rel = path.relative(srcRoot, f);
  const isConfig = rel.startsWith('configs' + path.sep) || rel.startsWith('configs/');
  const jsx = f.endsWith('.tsx') ? jsxTexts(code) : [];
  const all = [...strings.map((s) => ({ ...s, kind: 'str' })), ...jsx.map((s) => ({ ...s, kind: 'jsx' }))];

  for (const s of all) {
    const t = s.text;
    if (!HANGUL.test(t)) continue;
    // 메뉴 이름은 navigation.ts에서 관리하기로 한 파일이라 하드코딩 검사에서 뺀다
    if (!isConfig && !/navigation\.ts$/.test(f) && /\.(tsx|ts)$/.test(f) && !/(^|\/)(api|route)/.test(rel)) {
      const line = src.split('\n')[s.line - 1] || '';
      if (s.kind === 'jsx') add('TSX 하드코딩 문구(중간)', f, s.line, '', t, 'configs/contents로 옮긴다');
      else if (/console\.|throw new|Error\(/.test(line)) { /* 개발자용 메시지 */ }
      else if (A11Y_PREV.test(s.prev || '')) add('TSX 접근성 라벨(낮음)', f, s.line, '', t, 'aria-label·alt도 configs로 모으면 좋다');
      else add('TSX 하드코딩 문구(중간)', f, s.line, '', t, '속성·기본값·배열 문구도 configs/contents로');
    }
    for (const r of AI_RULES) {
      const re = new RegExp(r.re.source, r.re.flags.replace('g', ''));
      const m = t.match(re);
      if (!m) continue;
      if (r.id === 'E05' && (t.match(/수\s?있(?:습니다|어요)/g) || []).length < 2) continue;
      // 홈페이지 예외: '고객 여정'·'구매 여정'은 마케팅 용어(구어 표에서 고른 말)라 은유로 보지 않는다
      if (r.id === 'H05' && m[0] === '여정' && JOURNEY_OK.test(t)) continue;
      add(`AI 말투 ${r.id} ${r.name}`, f, s.line, m[0], t, r.alt);
    }
    { const m = t.match(PLACEHOLDER) || (isConfig && t.trim().match(PLACEHOLDER_EXACT)); if (m) add('스타터 자리표시 잔여(높음)', f, s.line, m[0], t, '실제 값으로 바꾸거나 지운다'); }
    for (const [re, alt] of BANNED) { const m = t.match(re); if (m) add('금지 표현', f, s.line, m[0], t, alt); }
    if (/^[A-Z][A-Z0-9 ·\-]{3,}$/.test(t.trim()) && !ACRONYM.test(t.trim().replace(/\b(SEO|GEO|AEO|CPC|CTR|B2B|B2C|FAQ|IMC|GA4|API|URL|HTML|SNS|AI|OG|PR|CEO|UX|UI|SERP|KPI|ROI|CRM)\b/g, 'X'))) add('금지 표현', f, s.line, t.trim(), t, '영문 대문자 머리말 대신 한국어 라벨');
    for (const [re, alt] of COLLOQUIAL) { const m = t.match(re); if (m) add('구어 → 마케팅 용어', f, s.line, m[0], t, alt); }
    if (!isTitleLike(t)) for (const [wrong, right] of Object.entries(TERMS)) if (t.includes(wrong) && !t.includes(right)) add('용어 통일', f, s.line, wrong, t, `→ ${right}`);
    if (HEYO && t.length >= 8 && !/\?$/.test(t.trim()) && !isQuote(t) && !REQUEST_OK.test(t.trim())) { const re = new RegExp(HEYO.re.source, 'mu'); const m = t.trim().match(re); if (m) add('해요체 혼입(합니다체 사이트)', f, s.line, m[0], t, '고객 대사가 아니면 합니다체로'); }
  }
}

const cats = Object.keys(hits).sort((a, b) => hits[b].length - hits[a].length);
console.log(`# 문구 검사: ${root} (${files.length}개 파일)\n`);
if (!cats.length) console.log('문제 후보 없음');
for (const c of cats) {
  console.log(`## ${c} (${hits[c].length})`);
  for (const h of hits[c].slice(0, Number(opt.max))) console.log(`- ${h.file}:${h.line}${h.match ? ` [${h.match}]` : ''} ${h.text}${h.note ? `  → ${h.note}` : ''}`);
  if (hits[c].length > Number(opt.max)) console.log(`- … ${hits[c].length - Number(opt.max)}건 더 (--max로 늘림)`);
  console.log('');
}
console.log('판단은 사람이 한다: 업계 용어("검색 자리", "지면"), 고객 대사, 브랜드 표기는 예외일 수 있다.');
if (opt.json) fs.writeFileSync(opt.json, JSON.stringify(hits, null, 1));
