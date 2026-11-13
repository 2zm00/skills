# 디자인 도구 (anti-slop)

`copy-design.md` §8의 금지·확정 패턴을 지키면서, 외부 디자인 스킬로 섹션을 만들고 검수하는 방법을 적는다. 조사·테스트일은 2026-11-03이다.

## 우선순위

1. `frontend-rules.md`: 문구는 `configs/contents/*`에, 컴포넌트는 `container/<Page>/` 4파일에 둔다. 디자인 도구가 TSX에 넣은 문구는 모두 configs로 옮긴다.
2. `copy-design.md` §8: 디자인 금지·확정 패턴.
3. 아래 도구의 규칙과 감지기 결과.

규칙이 충돌하면 위쪽을 따른다.

## 쓰는 도구

| 역할 | 도구 | 설치 |
|---|---|---|
| 섹션 제작·다듬기, 편집할 때 자동 검사 | impeccable (pbakaus/impeccable, ★101k) | `npx impeccable install --providers=claude --scope=project` |
| 레퍼런스 | `inspo` MCP, awesome-design-md (VoltAgent, ★125k) | `curl -o DESIGN.md https://raw.githubusercontent.com/VoltAgent/awesome-design-md/main/design-md/<brand>/DESIGN.md` |
| 방향 탐색(선택) | taste-skill (`design-taste-frontend`, 전역 설치) | 빌드 1회에 30~45분 걸린다. 방향이 막힐 때만 쓴다 |

쓰지 않는 것: ui-ux-pro-max. 테스트에서 Glassmorphism, `#2563EB`, Plus Jakarta Sans, Hero→Features→CTA 템플릿을 추천했다. 이 조합은 impeccable이 slop으로 잡는다.

## 흐름 (SKILL.md 3단계 시안과 5단계에서)

1. 레퍼런스: inspo는 `recommend` 1회 → `search_screens` 1~2회 → `get_screen` 3~5개로 끝낸다. DESIGN.md는 하나만 받는다. 여러 브랜드를 섞지 않는다.
2. `/impeccable init`으로 PRODUCT.md를 만든다. 업체·대상·목적은 IA 문서에서 가져온다.
3. 섹션 단위로 만든다: `/impeccable <섹션> 만들어줘`. 페이지 전체보다 섹션 하나를 맡길 때 결과가 좋다.
4. 조정: `bolder` `quieter` `distill` `typeset` `layout` `colorize` `animate`. `animate`를 쓰더라도 §8의 "모든 섹션 등장 효과 금지"와 `prefers-reduced-motion` 규칙을 지킨다.
5. 검수: `/impeccable critique <대상>`, `/impeccable audit <대상>`.
6. 마무리: `/impeccable polish` → `harden` → `adapt`. 그다음 문구를 configs로 옮겼는지 `copy-lint.mjs`로 확인한다.

## 출시 전 점검 (SKILL.md 6단계에 추가)

```bash
npx impeccable detect http://localhost:<포트>          # 렌더 기준(대비·작은 글자 포함). exit 2 = 발견
```

- 반드시 고친다: 대비, 포커스, reduced-motion, 모바일 레이아웃, 출처 없는 수치.
- 나머지는 판단해서 고친다. 잘 만든 linear.app에서도 impeccable이 21건(nested-cards 21, low-contrast 12 등)을 낸다. 결과를 판정이 아니라 체크리스트로 쓴다.
- 브랜드 폰트가 걸리면 `npx impeccable ignores add-value overused-font <Font> --reason "Brand font"`로 예외를 등록한다.

## 테스트 결과 (2026-11-03)

| 대상 | 결과 |
|---|---|
| `impeccable detect` slop 예제 HTML | 위반 7건: Inter, 보라 그라데이션, gradient text, 평평한 타입 위계, cramped padding |
| `impeccable detect https://linear.app` | 위반 21건, 권고 31건. 오탐이 많다 |

## 주의

- impeccable hook(`.claude/settings.local.json`)은 모델 승인 없이 Edit/Write/Stop 때마다 실행된다. 끄려면 `--settings '{"disableAllHooks": true}'`를 쓴다.
- impeccable은 새 디자인을 시작할 때 impeccable.style 카탈로그에 요청을 보낸다. 텔레메트리는 `npx impeccable telemetry off`로 끈다. 꺼도 카탈로그 요청은 나간다.
- 전역에 디자인 스킬이 여러 개 있어서(`design-taste-frontend`, `high-end-visual-design`, `minimalist-ui`, `frontend-design` 등) 같은 요청에 여러 개가 걸릴 수 있다. `/impeccable …`처럼 이름을 지정해 부른다.
- 팀 저장소에서는 `.claude/`와 `skills-lock.json`을 커밋할지 저장소 주인과 정한다.
