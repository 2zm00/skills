// 홈페이지 문의 → 메일 여러 곳 발송 + 구글 시트 백업 (Google Apps Script 웹 앱)
// 1) 새 Apps Script 프로젝트에 붙여 넣고 TO·SECRET·SHEET_NAME·BRAND를 채운다. SECRET은 저장소에 쓰지 않는다.
// 2) setupTest를 한 번 실행해 메일·시트 권한을 승인한다(테스트 메일 도착 확인).
// 3) 배포 → 새 배포 → 웹 앱, 실행 계정 "나", 액세스 "모든 사용자" → 웹 앱 URL을
//    배포 환경변수 CONTACT_WEBHOOK_URL, SECRET을 CONTACT_WEBHOOK_SECRET에 넣는다.
// 4) curl은 POST 후 리디렉션을 따라가야 응답이 보인다(-L, 본문은 --data).
// 개인 구글 계정은 하루 메일 발송 한도가 있다(받는 사람 수만큼 차감).
const TO = 'owner@example.com,second@example.com';
const SECRET = '__SECRET__';
const SHEET_NAME = '홈페이지 문의';
const BRAND = '브랜드명';

function doPost(e) {
  let d = {};
  try { d = JSON.parse(e.postData.contents); } catch (err) { return out_({ ok: false, error: 'bad json' }); }
  if (d.secret !== SECRET) return out_({ ok: false, error: 'forbidden' });
  const clean = (v, n) => String(v || '').replace(/\r/g, '').slice(0, n);
  const company = clean(d.company, 100), name = clean(d.name, 50), phone = clean(d.phone, 40);
  const interests = clean((d.interests || []).join(', '), 300), message = clean(d.message, 3000), page = clean(d.page, 200);
  if (!company || !phone) return out_({ ok: false, error: 'required' });
  const body = [
    '회사명: ' + company,
    '담당자: ' + (name || '-'),
    '연락처: ' + phone,
    '관심 분야: ' + (interests || '-'),
    '',
    '내용:',
    message || '-',
    '',
    '접수: ' + Utilities.formatDate(new Date(), 'Asia/Seoul', 'yyyy-MM-dd HH:mm') + ' · ' + page,
  ].join('\n');
  MailApp.sendEmail({ to: TO, subject: '[' + BRAND + ' 문의] ' + company, body: body, name: BRAND + ' 홈페이지' });
  try { sheet_().appendRow([new Date(), company, name, phone, interests, message, page]); } catch (err) {}
  return out_({ ok: true });
}

function sheet_() {
  const props = PropertiesService.getScriptProperties();
  let id = props.getProperty('SHEET_ID');
  if (!id) {
    const ss = SpreadsheetApp.create(SHEET_NAME);
    ss.getSheets()[0].appendRow(['접수 시각', '회사명', '담당자', '연락처', '관심 분야', '내용', '페이지']);
    id = ss.getId();
    props.setProperty('SHEET_ID', id);
  }
  return SpreadsheetApp.openById(id).getSheets()[0];
}

function out_(o) {
  return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
}

function setupTest() {
  sheet_();
  MailApp.sendEmail({ to: TO, subject: '[' + BRAND + '] 홈페이지 문의 연결 테스트', body: '이 메일이 모든 주소로 왔다면 문의 폼 연결이 끝난 것입니다.', name: BRAND + ' 홈페이지' });
}
