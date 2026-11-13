#!/usr/bin/env node
// checklist.json에서 필요한 항목·필드만 짧게 출력한다(checklist.md 전체를 읽지 않기 위해).
// 사용: node checklist.mjs [--tier b2c|std|b2b] [--no T17,T37] [--area 크롤링] [--cls A,A+] [--fields no,title,how,human,indirect]
//   기본 필드: no,title,cls,how   (human=사람이 줄 것, indirect=확정 못 하는 부분·간접 조사, src=출처, imp=중요도)
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const here = path.dirname(fileURLToPath(import.meta.url));
const items = JSON.parse(fs.readFileSync(path.join(here, '..', '..', 'references', 'audit', 'checklist.json'), 'utf8'));
const a = process.argv.slice(2); const o = {};
for (let i = 0; i < a.length; i++) o[a[i].replace(/^--/, '')] = a[++i];
const list = s => (s || '').split(',').map(x => x.trim()).filter(Boolean);
let xs = items;
if (o.tier === 'b2c') xs = xs.filter(x => x.b2c === '핵심');
else if (o.tier === 'std') xs = xs.filter(x => x.tier === '공통');
if (o.no) { const set = new Set(list(o.no)); xs = items.filter(x => set.has(x.no)); }
if (o.area) xs = xs.filter(x => x.area.includes(o.area));
if (o.cls) { const set = new Set(list(o.cls)); xs = xs.filter(x => set.has(x.cls)); }
const fields = o.fields ? list(o.fields) : ['no', 'title', 'cls', 'how'];
for (const x of xs) console.log(fields.map(f => (x[f] ?? '').toString().trim() || '-').join(' | '));
console.error(`${xs.length}개`);
