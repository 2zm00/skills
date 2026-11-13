// 서버 전용: 문의를 넘길 외부 수신처(Google Apps Script 웹 앱 등).
// src/app/api/contact/route.ts 에서만 import 한다. 브라우저 번들에 들어가면 안 된다.
// 값은 배포 환경변수로만 넣는다. 저장소·문서에 키를 쓰지 않는다.
export const contactWebhookUrl = process.env.CONTACT_WEBHOOK_URL ?? "";
export const contactWebhookSecret = process.env.CONTACT_WEBHOOK_SECRET ?? "";
