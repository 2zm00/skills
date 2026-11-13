import { companyInfo } from "@/configs/companyInfo";
import { allPageMeta, pageUrl } from "@/configs/contents/seoContent";

// /llms.txt: AI 검색·에이전트가 사이트를 요약해 읽는 마크다운 안내 파일 (llmstxt.org 형식).
// 사이트맵·RSS와 같은 allPageMeta에서 만든다. 표준 제안 단계라 순위 효과는 보장되지 않는다. 비용이 거의 없어 둔다.
export const dynamic = "force-static";

export function GET() {
  const pages = allPageMeta.map((meta) => `- [${meta.title}](${pageUrl(meta.path)}): ${meta.description}`);
  const contact = [
    companyInfo.tel && `- 전화: ${companyInfo.tel}`,
    companyInfo.email && `- 이메일: ${companyInfo.email}`,
    companyInfo.address && `- 주소: ${companyInfo.address}`,
  ].filter(Boolean);

  const body = [
    `# ${companyInfo.name}`,
    "",
    `> ${companyInfo.description}`,
    "",
    "## 페이지",
    "",
    ...pages,
    ...(companyInfo.blogUrl ? ["", "## 블로그", "", `- [블로그](${companyInfo.blogUrl})`] : []),
    ...(contact.length ? ["", "## 연락처", "", ...contact] : []),
    "",
  ].join("\n");

  return new Response(body, { headers: { "Content-Type": "text/plain; charset=utf-8" } });
}
