#!/usr/bin/env python3
"""예시성형외과 리포트 형식의 테크니컬 SEO 진단 docx를 만든다.

사용
  python3 build_report.py init --tier b2c|std|b2b [--extra T39,T90] --out audit.json
      checklist.json에서 범위에 맞는 항목으로 빈 판정 파일을 만든다.
      b2c = B2C 핵심 26개, std = 공통 50개, b2b = 전체 103개. --extra로 조건부·선택 항목을 더한다.
  python3 build_report.py render audit.json --out report.docx

audit.json
{
  "title": "OO의원 SEO 기술 진단 리포트",
  "subtitle": "전략·기획 · 백엔드·인프라 · 프론트·디자인 통합   |   진단 기간 2026-10-19 ~ 10-21   |   <작성 회사명>",
  "note": "※ 본 진단은 ... 데이터 해석과 판정 근거 중심으로 기술함.",
  "summary_table": true,
  "priority_table": true,
  "cards": "all",            # all = 전 항목 카드(B2B), issues = 문제·보완만 카드, 정상은 요약 표에만(B2C)
  "items": [
    {"no": "T17", "title": "봇 접근 차단", "verdict": "problem|improve|ok|na|todo",
     "summary": "한 문장", "evidence": "확인 내용(줄바꿈 가능)",
     "images": [{"path": "tmp/evidence/T17-rrt-1.png", "caption": "리치 결과 테스트, 2026-10-20"}],
     "opinion": "진단 소견"}
  ]
}
verdict가 todo인 항목은 렌더링에서 빠진다(아직 판정 안 함). na는 정상으로 표시하고 요약에 '대상 없음'을 쓴다.
"""
import argparse
import json
import os
import sys

from docx import Document
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.image.image import Image as DocxImage
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
from docx.shared import Cm, Mm, Pt, RGBColor

HERE = os.path.dirname(os.path.abspath(__file__))
CHECKLIST = os.path.join(HERE, '..', '..', 'references', 'audit', 'checklist.json')
FONT = '맑은 고딕'
NAVY = '1F3864'
GRAY = '767171'
VERDICT = {
    'problem': ('■ 문제', '검색 노출에 손실 발생', 'C00000'),
    'improve': ('▲ 보완', '당장 손실은 작으나 정비 필요', 'BF8F00'),
    'ok': ('● 정상', '조치 불필요', '2E7D32'),
}
CONTENT_W = 9360  # twips (A4, 좌우 22.5mm)


def init(args):
    items = json.load(open(CHECKLIST, encoding='utf-8'))
    extra = set(x.strip() for x in (args.extra or '').split(',') if x.strip())
    if args.tier == 'b2b':
        pick = items
    elif args.tier == 'std':
        pick = [x for x in items if x['tier'] == '공통' or x['no'] in extra]
    else:
        pick = [x for x in items if x.get('b2c') == '핵심' or x['no'] in extra]
    out = {
        'title': '<사이트명> SEO 기술 진단 리포트',
        'subtitle': '전략·기획 · 백엔드·인프라 · 프론트·디자인 통합   |   진단 기간 YYYY-MM-DD ~ MM-DD   |   <작성 회사명>',
        'note': '※ 본 진단은 Google Search Console 데이터, 사이트 크롤링, 브라우저 실측, 페이지 성능 측정 결과를 기반으로 수행되었으며, 이하 항목은 사용 도구가 아닌 데이터 해석과 판정 근거 중심으로 기술함.',
        'summary_table': True,
        'priority_table': True,
        'cards': 'all' if args.tier == 'b2b' else 'issues',
        'items': [{'no': x['no'], 'title': x['title'], 'class': x['cls'], 'verdict': 'todo', 'summary': '', 'evidence': '', 'images': [], 'opinion': ''} for x in pick],
    }
    json.dump(out, open(args.out, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    print(f'{len(pick)}개 항목으로 {args.out} 생성 ({args.tier})')


def set_font(run, size=None, bold=None, color=None):
    run.font.name = FONT
    rpr = run._r.get_or_add_rPr()
    fonts = rpr.find(qn('w:rFonts'))
    if fonts is None:
        fonts = OxmlElement('w:rFonts')
        rpr.append(fonts)
    for k in ('w:ascii', 'w:hAnsi', 'w:eastAsia', 'w:cs'):
        fonts.set(qn(k), FONT)
    if size:
        run.font.size = Pt(size)
    if bold is not None:
        run.font.bold = bold
    if color:
        run.font.color.rgb = RGBColor.from_string(color)


def shade(cell, fill):
    tcpr = cell._tc.get_or_add_tcPr()
    shd = OxmlElement('w:shd')
    shd.set(qn('w:val'), 'clear')
    shd.set(qn('w:color'), 'auto')
    shd.set(qn('w:fill'), fill)
    tcpr.append(shd)


def borders(table, color='BFBFBF', inside_v='D9D9D9', none=False):
    tblpr = table._tbl.tblPr
    b = OxmlElement('w:tblBorders')
    for edge in ('top', 'left', 'bottom', 'right', 'insideH', 'insideV'):
        e = OxmlElement(f'w:{edge}')
        if none:
            e.set(qn('w:val'), 'nil')
        else:
            e.set(qn('w:val'), 'single')
            e.set(qn('w:sz'), '4')
            e.set(qn('w:space'), '0')
            e.set(qn('w:color'), inside_v if edge == 'insideV' else color)
        b.append(e)
    tblpr.append(b)


def widths(table, twips):
    table.autofit = False
    for row in table.rows:
        for i, w in enumerate(twips):
            cell = row.cells[i]
            tcpr = cell._tc.get_or_add_tcPr()
            tcw = OxmlElement('w:tcW')
            tcw.set(qn('w:w'), str(w))
            tcw.set(qn('w:type'), 'dxa')
            tcpr.append(tcw)


def write_cell(cell, text, size=9.5, bold=False, color='000000'):
    cell.text = ''
    lines = str(text or '').split('\n') or ['']
    for i, line in enumerate(lines):
        p = cell.paragraphs[0] if i == 0 else cell.add_paragraph()
        p.paragraph_format.space_after = Pt(2)
        p.paragraph_format.line_spacing = 1.25
        r = p.add_run(line)
        set_font(r, size, bold, color)


def label(doc, text):
    p = doc.add_paragraph()
    p.paragraph_format.space_before = Pt(6)
    p.paragraph_format.space_after = Pt(2)
    set_font(p.add_run(text), 10, True, NAVY)


def box(doc, text):
    t = doc.add_table(rows=1, cols=1)
    borders(t)
    widths(t, [CONTENT_W])
    write_cell(t.cell(0, 0), text)
    shade(t.cell(0, 0), 'FFFFFF')
    return t


def add_image(doc, img):
    path = img['path'] if isinstance(img, dict) else img
    if not os.path.exists(path):
        p = doc.add_paragraph()
        set_font(p.add_run(f'[이미지 없음: {path}]'), 8, False, 'C00000')
        return
    info = DocxImage.from_file(path)
    natural_cm = info.px_width / (info.horz_dpi or 96) * 2.54
    w = min(16.0, natural_cm if natural_cm > 4 else 16.0)
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p.add_run().add_picture(path, width=Cm(w))
    cap = img.get('caption') if isinstance(img, dict) else None
    if cap:
        c = doc.add_paragraph()
        c.alignment = WD_ALIGN_PARAGRAPH.CENTER
        set_font(c.add_run(cap), 8, False, GRAY)


def verdict_table(doc, verdict):
    t = doc.add_table(rows=1, cols=3)
    borders(t, none=True)
    widths(t, [3120, 3120, 3120])
    for i, key in enumerate(('problem', 'improve', 'ok')):
        name, sub, color = VERDICT[key]
        cell = t.cell(0, i)
        cell.text = ''
        p = cell.paragraphs[0]
        mark = '☒' if key == verdict else '☐'
        set_font(p.add_run(f'{mark} {name}'), 10, True, color)
        p2 = cell.add_paragraph()
        set_font(p2.add_run(sub), 8, False, GRAY)
        shade(cell, 'F7F7F7' if key == verdict else 'FFFFFF')


def item_header(doc, n, title):
    t = doc.add_table(rows=1, cols=2)
    borders(t)
    widths(t, [1100, 8260])
    write_cell(t.cell(0, 0), '항목', 9.5, True, 'FFFFFF')
    shade(t.cell(0, 0), NAVY)
    t.cell(0, 0).paragraphs[0].alignment = WD_ALIGN_PARAGRAPH.CENTER
    write_cell(t.cell(0, 1), f'{n}.  {title}', 10, True, '000000')


def table_rows(doc, header, rows, twips):
    t = doc.add_table(rows=1 + len(rows), cols=len(header))
    borders(t)
    widths(t, twips)
    for i, h in enumerate(header):
        write_cell(t.cell(0, i), h, 9, True, 'FFFFFF')
        shade(t.cell(0, i), NAVY)
    for r, row in enumerate(rows, 1):
        for c, v in enumerate(row):
            if isinstance(v, tuple):
                write_cell(t.cell(r, c), v[0], 9, True, v[1])
            else:
                write_cell(t.cell(r, c), v, 9)
    return t


def render(args):
    data = json.load(open(args.audit, encoding='utf-8'))
    items = [x for x in data['items'] if x.get('verdict') != 'todo']
    skipped = [x['no'] for x in data['items'] if x.get('verdict') == 'todo']
    doc = Document()
    sec = doc.sections[0]
    sec.page_width, sec.page_height = Mm(210), Mm(297)
    sec.left_margin = sec.right_margin = Mm(22.5)
    sec.top_margin, sec.bottom_margin = Mm(19.4), Mm(17.6)
    normal = doc.styles['Normal']
    normal.font.name = FONT
    normal.font.size = Pt(9.5)
    normal.element.rPr.rFonts.set(qn('w:eastAsia'), FONT)

    p = doc.add_paragraph()
    set_font(p.add_run(data.get('title', 'SEO 기술 진단 리포트')), 24, True, NAVY)
    if data.get('subtitle'):
        p = doc.add_paragraph()
        set_font(p.add_run(data['subtitle']), 13, False, GRAY)
    if data.get('note'):
        p = doc.add_paragraph()
        set_font(p.add_run(data['note']), 11, False, GRAY)

    def vcell(v):
        key = 'ok' if v == 'na' else v
        name, _, color = VERDICT[key]
        return (name, color)

    if data.get('summary_table', True):
        label(doc, '진단 결과 요약')
        counts = {k: sum(1 for x in items if (x['verdict'] if x['verdict'] != 'na' else 'ok') == k) for k in VERDICT}
        p = doc.add_paragraph()
        set_font(p.add_run(f"전체 {len(items)}개 항목 · 문제 {counts['problem']} · 보완 {counts['improve']} · 정상 {counts['ok']}"), 9.5, True, '000000')
        table_rows(doc, ['No', '항목', '판정', '요약'], [[str(i), x['title'], vcell(x['verdict']), x.get('summary', '')] for i, x in enumerate(items, 1)], [700, 2600, 1200, 4860])
        doc.add_page_break()

    card_items = items if data.get('cards', 'all') == 'all' else [x for x in items if x['verdict'] in ('problem', 'improve')]
    if data.get('cards') == 'issues':
        p = doc.add_paragraph()
        set_font(p.add_run('정상 항목은 위 요약 표로 갈음하고, 아래에는 문제·보완 항목만 상세히 기술함.'), 9, False, GRAY)
    for x in card_items:
        i = items.index(x) + 1  # 요약 표 번호와 맞춘다
        item_header(doc, i, x['title'])
        label(doc, '① 판정')
        verdict_table(doc, 'ok' if x['verdict'] == 'na' else x['verdict'])
        label(doc, '요약')
        box(doc, x.get('summary') or ('대상 없음' if x['verdict'] == 'na' else ''))
        label(doc, '② 확인 내용')
        box(doc, x.get('evidence', ''))
        for img in x.get('images', []):
            add_image(doc, img)
        label(doc, '③ 진단 소견')
        box(doc, x.get('opinion', ''))
        doc.add_paragraph()

    if data.get('priority_table', True):
        pri = [x for x in items if x['verdict'] == 'problem'] + [x for x in items if x['verdict'] == 'improve']
        if pri:
            doc.add_page_break()
            label(doc, '조치 우선순위')
            table_rows(doc, ['순위', '항목', '판정', '요약'], [[str(i), x['title'], vcell(x['verdict']), x.get('summary', '')] for i, x in enumerate(pri, 1)], [700, 2600, 1200, 4860])

    doc.save(args.out)
    print(f'{args.out} 저장: {len(items)}개 항목' + (f', 미판정 제외 {len(skipped)}개 ({",".join(skipped[:10])}{"…" if len(skipped) > 10 else ""})' if skipped else ''))


def main():
    ap = argparse.ArgumentParser()
    sub = ap.add_subparsers(dest='cmd', required=True)
    a = sub.add_parser('init')
    a.add_argument('--tier', choices=['b2c', 'std', 'b2b'], required=True)
    a.add_argument('--extra')
    a.add_argument('--out', required=True)
    b = sub.add_parser('render')
    b.add_argument('audit')
    b.add_argument('--out', required=True)
    args = ap.parse_args()
    init(args) if args.cmd == 'init' else render(args)


if __name__ == '__main__':
    sys.exit(main())
