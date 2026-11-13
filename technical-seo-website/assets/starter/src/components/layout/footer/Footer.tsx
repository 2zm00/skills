import { companyInfo, mailHref, telHref } from "@/configs/companyInfo";
import { uiText } from "@/configs/contents/uiContent";

// 서버 푸터. 정보는 companyInfo에서만 가져오고, 빈 값은 숨긴다.
export default function Footer() {
  const labels = uiText.footer;
  const rows = [
    { label: labels.company, value: companyInfo.name },
    { label: labels.ceo, value: companyInfo.ceo },
    { label: labels.businessNumber, value: companyInfo.businessNumber },
    { label: labels.address, value: companyInfo.address },
  ].filter((row) => row.value);

  return (
    <footer className="border-t border-gray-200 py-12">
      <div className="mx-auto max-w-[1280px] px-5 md:px-10">
        <dl className="flex flex-wrap gap-x-6 gap-y-1 text-sm">
          {rows.map((row) => (
            <div key={row.label} className="flex gap-2">
              <dt>{row.label}</dt>
              <dd>{row.value}</dd>
            </div>
          ))}
        </dl>
        <p className="mt-2 text-sm">
          {companyInfo.tel && <a href={telHref}>{companyInfo.tel}</a>} {companyInfo.email && <a href={mailHref}>{companyInfo.email}</a>}
        </p>
        <p className="mt-4 text-xs">
          © {companyInfo.copyrightYear} {companyInfo.name}
        </p>
      </div>
    </footer>
  );
}
