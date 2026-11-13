#!/usr/bin/env node
// 런칭·배포 직후 점검: robots·사이트맵·RSS·llms.txt·검색엔진 소유 확인 태그·확인 파일·GA·IndexNow 키·주소 통일(http/www)·404·지운 주소 리디렉션.
// 의존성 없음(Node 18+). 서치콘솔·서치어드바이저 안의 상태(소유 확인 완료·색인 수)는 브라우저로 따로 본다(references/launch.md).
//
// 사용
//   node launch-check.mjs https://example.com
//   옵션: --files googledfdd….html,naverc835….html   소유 확인 HTML 파일 이름(쉼표)
//         --indexnow-key <키>                       /<키>.txt 내용 확인
//         --ga G-XXXXXXX                            홈·블로그에 GA 측정 ID가 있는지
//         --removed "/old>/new,/old2>/new2"         지운 주소가 영구 이동(301·308)하는지
//         --blog /blog/                             같은 도메인 블로그 점검

const args = process.argv.slice(2);
const opt = {};
const pos = [];
for (let i = 0; i < args.length; i++) (args[i].startsWith('--') ? (opt[args[i].slice(2)] = args[++i]) : pos.push(args[i]));
if (!pos[0]) {
  console.error('사용: node launch-check.mjs https://도메인 [--files a.html,b.html] [--indexnow-key 키] [--ga G-…] [--removed "/a>/b"] [--blog /blog/]');
  process.exit(1);
}
const origin = new URL(pos[0]).origin;
const host = new URL(origin).hostname;
const UA = { 'User-Agent': 'Mozilla/5.0 (compatible; launch-check)' };
const results = [];
const ok = (cond, label, detail = '') => results.push({ mark: cond === null ? '–' : cond ? '✓' : '✗', label, detail });

async function req(url, manual = false) {
  try {
    const res = await fetch(url, { headers: UA, redirect: manual ? 'manual' : 'follow' });
    return { status: res.status, location: res.headers.get('location') || '', url: res.url, text: manual ? '' : await res.text(), headers: res.headers };
  } catch (e) {
    return { status: 0, error: String(e.message || e), text: '', location: '' };
  }
}
const metaContent = (html, name) => html.match(new RegExp(`<meta[^>]+name=["']${name}["'][^>]*content=["']([^"']+)["']`, 'i'))?.[1] || html.match(new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]*name=["']${name}["']`, 'i'))?.[1] || '';

(async () => {
  // 1. robots.txt
  const robots = await req(`${origin}/robots.txt`);
  ok(robots.status === 200, 'robots.txt 200', `응답 ${robots.status}`);
  const disallowAll = /User-agent:\s*\*[\s\S]*?Disallow:\s*\/\s*$/im.test(robots.text);
  ok(!disallowAll, 'robots.txt가 전체 차단하지 않음', disallowAll ? 'Disallow: / 있음' : '');
  const sitemaps = [...robots.text.matchAll(/^\s*Sitemap:\s*(\S+)/gim)].map((m) => m[1]);
  ok(sitemaps.length > 0, 'robots.txt에 사이트맵 표기', sitemaps.join(' , '));

  // 2. 사이트맵
  const list = sitemaps.length ? sitemaps : [`${origin}/sitemap.xml`];
  for (const sm of list) {
    const r = await req(sm);
    const locs = [...r.text.matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/g)].map((m) => m[1]);
    const isIndex = /<sitemapindex/i.test(r.text);
    const foreign = locs.filter((u) => { try { return new URL(u).hostname !== host; } catch { return true; } });
    ok(r.status === 200 && locs.length > 0, `사이트맵 ${sm.replace(origin, '')}`, `응답 ${r.status}, ${isIndex ? '하위 사이트맵' : '주소'} ${locs.length}개${foreign.length ? `, 다른 도메인 ${foreign.length}개` : ''}`);
    const xrobots = r.headers?.get?.('x-robots-tag');
    if (xrobots) ok(null, `  └ X-Robots-Tag: ${xrobots}`, '사이트맵 파일 자체의 noindex는 정상(워드프레스)');
  }

  // 3. 홈 HTML: 소유 확인 태그·GA·canonical·구조화 데이터
  const home = await req(`${origin}/`);
  ok(home.status === 200, '홈 200', `응답 ${home.status}`);
  const g = metaContent(home.text, 'google-site-verification');
  const n = metaContent(home.text, 'naver-site-verification');
  const b = metaContent(home.text, 'msvalidate.01');
  ok(Boolean(g), '구글 서치콘솔 소유 확인 메타', g ? `${g.slice(0, 12)}…` : '없음 (DNS로 확인했다면 무시)');
  ok(Boolean(n), '네이버 서치어드바이저 소유 확인 메타', n ? `${n.slice(0, 12)}…` : '없음 (HTML 파일로 확인했다면 무시)');
  ok(null, '빙 메타(msvalidate.01)', b ? '있음' : '없음 (서치콘솔 가져오기로 등록하면 필요 없음)');
  const gaIds = [...new Set(home.text.match(/G-[A-Z0-9]{6,12}/g) || [])];
  ok(opt.ga ? gaIds.includes(opt.ga) : gaIds.length > 0, 'GA4 태그', gaIds.join(', ') || '없음');
  const canonical = home.text.match(/<link[^>]+rel=["']canonical["'][^>]*href=["']([^"']+)["']/i)?.[1] || '';
  ok(canonical.replace(/\/$/, '') === origin, '홈 canonical이 운영 주소', canonical || '없음');
  // 조직 노드는 Organization 또는 LocalBusiness·MedicalClinic 같은 하위 타입이라 @id로 찾는다
  const orgType = home.text.match(/"@type":\s*"([A-Za-z]+)",\s*"@id":\s*"[^"]*#organization"/)?.[1];
  ok(Boolean(orgType) || /"@type":\s*"Organization"/.test(home.text), '조직 구조화 데이터', orgType || '');
  const rssHref = home.text.match(/<link[^>]+type=["']application\/rss\+xml["'][^>]*href=["']([^"']+)["']/i)?.[1]
    || home.text.match(/<link[^>]+href=["']([^"']+)["'][^>]*type=["']application\/rss\+xml["']/i)?.[1];
  if (rssHref) {
    const r = await req(new URL(rssHref, origin).href);
    const items = (r.text.match(/<item>/g) || []).length;
    ok(r.status === 200 && /<rss/i.test(r.text) && items > 0, 'RSS 피드', `${rssHref} 응답 ${r.status}, 항목 ${items}개`);
  } else ok(null, 'RSS 피드 링크(rel=alternate)', '없음 (블로그 피드만 제출한다면 무시)');
  const llms = await req(`${origin}/llms.txt`);
  ok(llms.status === 200 && /^#\s+\S/m.test(llms.text) ? true : null, '/llms.txt', llms.status === 200 ? `링크 ${(llms.text.match(/\]\(https?:/g) || []).length}개` : `응답 ${llms.status} (선택 사항)`);
  const aiBlocked = ['GPTBot', 'ClaudeBot', 'PerplexityBot', 'Google-Extended', 'OAI-SearchBot'].filter((bot) =>
    new RegExp(`User-agent:\\s*${bot}\\s*\\n(?:(?!User-agent)[^\\n]*\\n)*?\\s*Disallow:\\s*/\\s*$`, 'im').test(robots.text));
  ok(aiBlocked.length ? null : true, 'robots.txt AI 크롤러 허용', aiBlocked.length ? `차단: ${aiBlocked.join(', ')} (의도한 것인지 확인)` : '차단 없음');
  const ogImg = home.text.match(/<meta[^>]+property=["']og:image["'][^>]*content=["']([^"']+)["']/i)?.[1];
  if (ogImg) { const r = await req(new URL(ogImg, origin).href); ok(r.status === 200, 'OG 이미지 200', ogImg); } else ok(false, 'OG 이미지', '없음');

  // 4. 소유 확인 파일·IndexNow 키
  for (const f of (opt.files || '').split(',').map((s) => s.trim()).filter(Boolean)) {
    const r = await req(`${origin}/${f}`);
    ok(r.status === 200 && r.text.includes(f.replace(/\.html$/, '')), `확인 파일 /${f}`, `응답 ${r.status}`);
  }
  if (!opt.files) ok(null, '소유 확인 HTML 파일', '--files로 이름을 주면 확인한다');
  if (opt['indexnow-key']) {
    const k = opt['indexnow-key'];
    const r = await req(`${origin}/${k}.txt`);
    ok(r.status === 200 && r.text.trim() === k, 'IndexNow 키 파일', `응답 ${r.status}`);
  } else ok(null, 'IndexNow 키 파일', '--indexnow-key로 키를 주면 확인한다');

  // 5. 주소 통일: http → https, www ↔ 루트
  const http = await req(`http://${host}/`, true);
  ok([301, 308].includes(http.status) && http.location.startsWith('https://'), 'http → https 영구 이동', `${http.status} ${http.location}`);
  const altHost = host.startsWith('www.') ? host.slice(4) : `www.${host}`;
  const alt = await req(`https://${altHost}/`, true);
  if (alt.status === 0) ok(null, `${altHost} 접속`, '연결 안 됨(DNS 없음이면 정상)');
  else ok([301, 308].includes(alt.status) && alt.location.includes(host), `${altHost} → ${host} 영구 이동`, `${alt.status} ${alt.location}`);

  // 6. 없는 주소는 404
  const missing = await req(`${origin}/__launch-check-${Date.now()}`, true);
  ok(missing.status === 404, '없는 주소 404', `응답 ${missing.status}`);

  // 7. 지운 주소 리디렉션
  for (const pair of (opt.removed || '').split(',').map((s) => s.trim()).filter(Boolean)) {
    const [from, to] = pair.split('>').map((s) => s.trim());
    const r = await req(`${origin}${from}`, true);
    const dest = r.location ? new URL(r.location, origin).pathname : '';
    ok([301, 308].includes(r.status) && (!to || dest === to), `지운 주소 ${from} → ${to || '?'}`, `${r.status} ${r.location}`);
  }

  // 8. 블로그
  if (opt.blog) {
    const blogUrl = `${origin}${opt.blog}`;
    const r = await req(blogUrl);
    ok(r.status === 200, `블로그 ${opt.blog} 200`, `응답 ${r.status}`);
    const bc = r.text.match(/<link[^>]+rel=["']canonical["'][^>]*href=["']([^"']+)["']/i)?.[1] || '';
    ok(bc.startsWith(origin), '블로그 canonical이 같은 도메인', bc || '없음');
    const bga = [...new Set(r.text.match(/G-[A-Z0-9]{6,12}/g) || [])];
    ok(opt.ga ? bga.includes(opt.ga) : bga.length > 0, '블로그 GA4 태그', bga.join(', ') || '없음');
    const feed = await req(`${blogUrl.replace(/\/$/, '')}/feed/`);
    ok(feed.status === 200 && /<rss|<feed/i.test(feed.text), '블로그 RSS', `응답 ${feed.status}`);
  }

  // 출력
  console.log(`# 런칭 점검: ${origin} (${new Date().toISOString().slice(0, 16).replace('T', ' ')} UTC)\n`);
  for (const r of results) console.log(`${r.mark} ${r.label}${r.detail ? `: ${r.detail}` : ''}`);
  const fails = results.filter((r) => r.mark === '✗').length;
  console.log(`\n실패 ${fails}개 / 확인 ${results.filter((r) => r.mark === '✓').length}개 / 참고 ${results.filter((r) => r.mark === '–').length}개`);
  console.log('서치콘솔·서치어드바이저의 소유 확인 완료, 사이트맵 처리, 색인 수는 브라우저로 확인한다.');
})().catch((e) => { console.error(e); process.exit(1); });
