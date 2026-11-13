import { contactApiUrl } from "@/configs/urls/apiUrl";

// 서버·API 요청은 이 파일에서만. 타입을 명시하고 any를 쓰지 않는다. 주소는 configs/urls/apiUrl.ts 변수로.

export interface ContactRequest {
  company: string;
  name: string;
  phone: string;
  message: string;
  interests: string[];
  // 봇용 숨김 칸 (사람은 비워 둔다)
  website: string;
  page: string;
}

interface ContactResponse {
  ok?: boolean;
  error?: string;
}

export const RequestContact = async (payload: ContactRequest): Promise<boolean> => {
  try {
    const res = await fetch(contactApiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) return false;
    const data: ContactResponse = await res.json();
    return Boolean(data.ok);
  } catch (error) {
    console.error("Contact Request Error", error);
    return false;
  }
};
