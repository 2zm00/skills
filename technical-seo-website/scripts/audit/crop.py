#!/usr/bin/env python3
"""화면 캡처에서 증거 영역만 잘라낸다.

이 REPL의 page.screenshot({clip})은 x·y를 무시하고 왼쪽 위에서부터 자른다(2026-10 확인).
그래서 화면 전체를 찍은 뒤 이 스크립트로 자른다.

사용: python3 crop.py full.png out.png --box x,y,w,h [--scale 2] [--pad 8] [--mask x,y,w,h ...]
  --box   : CSS 픽셀 기준 영역(getBoundingClientRect 값)
  --scale : devicePixelRatio (기본 2)
  --mask  : 가릴 영역(계정 아이콘·연락처 등). 여러 번 줄 수 있다. CSS 픽셀 기준, 자르기 전 좌표.
"""
import argparse
from PIL import Image, ImageDraw, ImageFilter

ap = argparse.ArgumentParser()
ap.add_argument('src')
ap.add_argument('out')
ap.add_argument('--box', required=True)
ap.add_argument('--scale', type=float, default=2.0)
ap.add_argument('--pad', type=float, default=8)
ap.add_argument('--mask', action='append', default=[])
ap.add_argument('--red', action='append', default=[], help='빨간 상자로 강조할 영역. CSS 픽셀, 자르기 전 좌표')
ap.add_argument('--blur', action='append', default=[], help='흐리게 할 영역(이름·주소·사진). CSS 픽셀, 자르기 전 좌표')
a = ap.parse_args()

im = Image.open(a.src).convert('RGB')
s = a.scale
draw = ImageDraw.Draw(im)
for m in a.mask:
    x, y, w, h = [float(v) for v in m.split(',')]
    draw.rectangle([x * s, y * s, (x + w) * s, (y + h) * s], fill=(200, 200, 200))
for m in a.blur:
    x, y, w, h = [float(v) for v in m.split(',')]
    bx = (int(x * s), int(y * s), int((x + w) * s), int((y + h) * s))
    reg = im.crop(bx).filter(ImageFilter.GaussianBlur(radius=max(8, int(h * s / 3))))
    im.paste(reg, bx)
draw = ImageDraw.Draw(im)
for m in a.red:
    x, y, w, h = [float(v) for v in m.split(',')]
    draw.rectangle([(x - 3) * s, (y - 3) * s, (x + w + 3) * s, (y + h + 3) * s], outline=(225, 29, 72), width=int(3 * s))
x, y, w, h = [float(v) for v in a.box.split(',')]
l = max(0, (x - a.pad) * s)
t = max(0, (y - a.pad) * s)
r = min(im.width, (x + w + a.pad) * s)
b = min(im.height, (y + h + a.pad) * s)
im.crop((int(l), int(t), int(r), int(b))).save(a.out)
print(f'{a.out} {int(r - l)}x{int(b - t)}')
