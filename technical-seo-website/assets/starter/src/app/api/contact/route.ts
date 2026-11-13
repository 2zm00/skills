import { NextResponse } from "next/server";
import { contactWebhookSecret, contactWebhookUrl } from "@/configs/urls/contactWebhook";

// 문의 접수: 브라우저 → 이 라우트 → 외부 수신처(Apps Script: 메일 여러 곳 + 시트 백업)
// mailto:는 쓰지 않는다. 신청자가 메일 앱에서 보내지 않으면 유실된다.
export async function POST(req: Request) {
  if (!contactWebhookUrl || !contactWebhookSecret) {
    return NextResponse.json({ ok: false, error: "not_configured" }, { status: 503 });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "bad_request" }, { status: 400 });
  }

  // 봇용 숨김 칸이 채워져 있으면 성공처럼 응답하고 버린다
  if (typeof body.website === "string" && body.website.trim()) {
    return NextResponse.json({ ok: true });
  }

  const text = (value: unknown, max: number) => (typeof value === "string" ? value.trim().slice(0, max) : "");
  const company = text(body.company, 100);
  const phone = text(body.phone, 40);
  if (!company || !phone) {
    return NextResponse.json({ ok: false, error: "required" }, { status: 400 });
  }

  const payload = {
    secret: contactWebhookSecret,
    company,
    name: text(body.name, 50),
    phone,
    interests: Array.isArray(body.interests) ? body.interests.filter((item) => typeof item === "string").slice(0, 12) : [],
    message: text(body.message, 3000),
    page: text(body.page, 200),
  };

  try {
    const res = await fetch(contactWebhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      redirect: "follow",
      cache: "no-store",
    });
    const data = (await res.json().catch(() => null)) as { ok?: boolean } | null;
    if (!res.ok || !data?.ok) {
      console.error("Contact webhook error", res.status, data);
      return NextResponse.json({ ok: false, error: "send_failed" }, { status: 502 });
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Contact webhook fetch error", error);
    return NextResponse.json({ ok: false, error: "send_failed" }, { status: 502 });
  }
}
