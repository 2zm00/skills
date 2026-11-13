import Script from "next/script";
import { companyInfo } from "@/configs/companyInfo";

// GA4 기본 태그. 운영 빌드에서만, gtag.js는 load 이후(lazyOnload)에 받아 첫 화면 속도에 영향이 없게 한다.
// 이 방식이면 서치콘솔 "GA로 소유 확인"이 실패하므로 소유 확인은 메타 태그 + HTML 파일로 한다.
// 전환 이벤트(문의 접수·전화·카카오톡 클릭)는 CTA가 확정된 뒤 gtag('event', ...)로 붙인다.
export default function GoogleAnalytics() {
  const id = companyInfo.gaMeasurementId;
  if (!id || process.env.NODE_ENV !== "production") return null;
  return (
    <>
      <Script src={`https://www.googletagmanager.com/gtag/js?id=${id}`} strategy="lazyOnload" />
      <Script id="ga4-init" strategy="afterInteractive">
        {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${id}');`}
      </Script>
    </>
  );
}
