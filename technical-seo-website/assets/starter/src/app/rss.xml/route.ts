import { companyInfo } from "@/configs/companyInfo";
import { allPageMeta, pageUrl } from "@/configs/contents/seoContent";

// /rss.xml: 네이버 서치어드바이저 RSS 제출용 (RSS 2.0). 사이트맵과 같은 allPageMeta에서 만든다.
// 같은 도메인 블로그가 있으면 서치어드바이저에는 블로그 피드(/blog/feed/)를 내고, 이 피드는 그대로 둬도 된다.
export const dynamic = "force-static";

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const rfc822 = (d: string) => new Date(d).toUTCString();

export function GET() {
  // 최근에 고친 페이지가 위로
  const pages = [...allPageMeta].sort((a, b) =>
    (b.updatedAt ?? b.publishedAt ?? "").localeCompare(a.updatedAt ?? a.publishedAt ?? ""),
  );
  const latest = pages.find((p) => p.updatedAt ?? p.publishedAt);
  const items = pages
    .map((meta) => {
      const url = pageUrl(meta.path);
      const date = meta.updatedAt ?? meta.publishedAt;
      return [
        "<item>",
        `<title>${esc(meta.title)}</title>`,
        `<link>${url}</link>`,
        `<guid isPermaLink="true">${url}</guid>`,
        `<description>${esc(meta.description)}</description>`,
        date ? `<pubDate>${rfc822(date)}</pubDate>` : "",
        "</item>",
      ].join("");
    })
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
<channel>
<title>${esc(companyInfo.name)}</title>
<link>${companyInfo.siteUrl}</link>
<description>${esc(companyInfo.description)}</description>
<language>ko</language>
<atom:link href="${companyInfo.siteUrl}/rss.xml" rel="self" type="application/rss+xml"/>
${latest ? `<lastBuildDate>${rfc822((latest.updatedAt ?? latest.publishedAt)!)}</lastBuildDate>` : ""}
${items}
</channel>
</rss>`;

  return new Response(xml, { headers: { "Content-Type": "application/rss+xml; charset=utf-8" } });
}
