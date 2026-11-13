import { clsx, type ClassValue } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

// theme.css의 글자 크기 토큰(text-body-1 등)을 font-size로 등록한다.
// 등록하지 않으면 tailwind-merge가 색상으로 오인해 text-white 같은 색상 클래스를 지운다.
const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      "font-size": [{ text: ["display", "title-1", "title-2", "heading-1", "heading-2", "body-1", "body-1-reading", "body-2", "label"] }],
    },
  },
});

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
