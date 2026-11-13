#!/usr/bin/env node
// 검색결과 제목 폭(px) 추정. 계수는 스크리밍프로그 Title 1 Pixel Width 1,122건으로 회귀(중앙 오차 약 4px).
// 사용: node title-px.mjs "제목1" "제목2"   또는   node title-px.mjs --file titles.txt (한 줄에 하나)
//      --limit 561 (기본, 스크리밍프로그 경고선)  --json
import fs from 'fs';
import { pathToFileURL } from 'url';

const W = { hangul: 16.57, cjk: 16.85, lower: 9.42, upper: 11.84, digit: 10.54, space: 5.16, punct: 9.54 };

export function classOf(ch) {
  if (/[\uAC00-\uD7A3\u3130-\u318F]/.test(ch)) return 'hangul';
  if (/[\u3040-\u30FF\u4E00-\u9FFF\uFF01-\uFF60\u3000-\u303F]/.test(ch)) return 'cjk';
  if (/[a-z]/.test(ch)) return 'lower';
  if (/[A-Z]/.test(ch)) return 'upper';
  if (/[0-9]/.test(ch)) return 'digit';
  if (ch === ' ') return 'space';
  return 'punct';
}

export function titlePx(t) {
  let px = 0;
  for (const ch of t) px += W[classOf(ch)];
  return Math.round(px);
}

const isMain = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
const args = isMain ? process.argv.slice(2) : [];
if (args.length) {
  let limit = 561, json = false, titles = [];
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--limit') limit = +args[++i];
    else if (args[i] === '--json') json = true;
    else if (args[i] === '--file') titles.push(...fs.readFileSync(args[++i], 'utf8').split('\n').map(s => s.trim()).filter(Boolean));
    else titles.push(args[i]);
  }
  const out = titles.map(t => ({ title: t, chars: [...t].length, px: titlePx(t), over: titlePx(t) > limit }));
  if (json) console.log(JSON.stringify(out, null, 1));
  else for (const o of out) console.log(`${o.over ? '초과' : '정상'} ${String(o.px).padStart(4)}px ${String(o.chars).padStart(3)}자 | ${o.title}`);
}
