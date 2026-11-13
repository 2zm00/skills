import localFont from "next/font/local";

// 글꼴 파일은 src/app/fonts/ 에 둔다 (예: PretendardVariable.woff2)
export const pretendard = localFont({
  src: "./fonts/PretendardVariable.woff2",
  display: "swap",
  weight: "100 900",
  variable: "--font-pretendard",
});
