# 전체 사이트 톤앤매너 개편 계획서 (Design Revamp Plan)

> **문서 버전**: v0.1.0 (design.md 입력 대기 중)
> **작성일**: 2026-08-27
> **기준 문서**: 루트 `design.md` — **현재 0바이트(빈 파일)**. 아래 "TBD" 항목은 design.md 확정 후 채운다.
> **관련**: [development-plan.md](./development-plan.md) · [PRD.md](../PRD.md)

---

## 0. 상태 요약

| 항목 | 상태 |
|------|------|
| `design.md` (톤앤매너 소스) | ⛔ 비어 있음 — **팔레트·서체·radius·모션 값 미확정** |
| 현재 디자인 시스템 감사 | ✅ 완료 (§2) |
| 개편 방법론·단계 | ✅ 확정 (§3) |
| 파일별 작업 분해 | ✅ 확정 (§4) |
| 실제 토큰 매핑값 | ⛔ TBD — design.md 확보 후 §5 채움 |

> **다음 액션**: `design.md`에 톤앤매너 정의(색상 HEX/OKLCH, 서체명, 반경, 그림자, 모션 성격 등)를 채운다 → 본 문서 §5 토큰 매핑표 확정 → §3 단계대로 실행.

---

## 1. 목표

- 루트 `design.md`에 정의된 톤앤매너를 **전체 화면(단일 화면 + 6개 상태 패널 + API 없음)**에 일관되게 적용한다.
- 색상·타이포·간격·반경·그림자·모션을 **디자인 토큰 1곳(`app/globals.css`)에서 관리**하도록 정리하고, 컴포넌트에 박힌 하드코딩 값을 제거한다.
- PRD 요구사항(3초 이내 응답 체감, 단일 화면, 6종 예외 UI)과 기능 동작은 **변경하지 않는다**. 순수 시각 레이어만 교체.

## 2. 현재 디자인 시스템 감사 (Baseline)

### 2-1. 토큰 (`app/globals.css`, Tailwind v4 `@theme inline` + `:root`)

| 토큰 | 현재 값 (OKLCH) | 용도 |
|------|------------------|------|
| `--background` | `oklch(0.982 0.012 220)` | 페이지 배경 (쿨톤 오프화이트) |
| `--foreground` | `oklch(0.27 0.03 250)` | 본문 텍스트 |
| `--primary` | `oklch(0.58 0.13 218)` | 주요 버튼·링·강조 (청록빛 블루) |
| `--secondary` | `oklch(0.95 0.02 220)` | 카드 헤더 그라디언트, 칩 |
| `--muted` / `--muted-foreground` | `oklch(0.955 0.014 220)` / `oklch(0.55 0.03 240)` | 보조 배경·텍스트 |
| `--accent` / `--accent-foreground` | `oklch(0.94 0.07 85)` / `oklch(0.42 0.09 68)` | **"비유" 강조(앰버)** — 정의됐으나 컴포넌트가 미사용 |
| `--destructive` | `oklch(0.6 0.17 22)` | 에러 패널·빈입력 경고 |
| `--border` / `--input` / `--ring` | `oklch(0.9 0.02 225)` / 동일 / `--primary` | 테두리·입력·포커스 링 |
| `--radius` | `0.625rem` (→ `sm`~`4xl` 배수 파생) | 모든 곡률의 기준 |

### 2-2. 타이포그래피 (Google Fonts, `app/layout.tsx` `<link>`)

| 역할 | 토큰 | 서체 |
|------|------|------|
| 본문 | `--font-sans` | **Noto Sans KR** (400/500/700) |
| 디스플레이 | `--font-display` | **Outfit** (500/600/700) — 현재 거의 미사용 |
| 제목 | `--font-serif` | **Gowun Batang** (400/700) — h1/h2에 `font-serif` |

- `body`에 `word-break: keep-all` (한국어 줄바꿈 가독성).

### 2-3. 컬러 스킴 / 다크모드

- `app/layout.tsx`: `<html class="light">` + `viewport.colorScheme:'light'` + `themeColor:'#eff6fb'`(하드코딩 HEX) → **다크모드 강제 비활성**.
- `globals.css`에 `.dark` 및 `@media (prefers-color-scheme: dark)` 토큰이 **정의는 되어 있으나 도달 불가**(shadcn 기본값 잔재, 흑백 계열).

### 2-4. 컴포넌트 인벤토리

| 파일 | 역할 | 하드코딩 위험 |
|------|------|---------------|
| `components/term-explainer.tsx` | 상태 머신(검색/로딩/결과/예외6/타임아웃). 레이아웃 셸(헤더·sticky 검색 섹션·결과 섹션) 포함 | 낮음 (토큰 사용) |
| `components/search-bar.tsx` | 입력창 + 검색 버튼 + 빈입력 경고 | 낮음 (`primary`/`destructive` 토큰) |
| `components/result-card.tsx` | 결과 카드(정의/비유/역할 3요소, 스켈레톤, Reroll, source 뱃지) | **높음** — `amber-50/60`, `amber-200/60`, `amber-400/20`, `text-amber-700/800/900`, `yellow-50/50`, `shadow-[…oklch(…)]` inset·drop 다수 |
| `components/state-panels.tsx` | Initial/Loading/Irrelevant/Typo/Error/Delayed 6종 패널 + `StatusIndicator` | **중** — `bg-amber-100/80 text-amber-600 ring-amber-200/60` (Typo·Delayed 아이콘) |
| `components/state-preview-bar.tsx` | 데모용 상태 전환 툴바 | 검토 필요 (프로덕션 노출 여부 §6-D) |
| `components/ui/button.tsx` | base-ui + cva 버튼 (variant 6종, size 8종) | 낮음 (토큰 기반) |

### 2-5. 모션 (`app/globals.css`)

| 키프레임 | 용도 |
|----------|------|
| `shake` (0.35s) | 빈 입력 경고 (`animate-shake`) |
| `fade-up` (0.45s, cubic-bezier) | 결과 영역 진입 |
| `ping-slow` (1.8s infinite) | 로딩 패널 배경 펄스 |
| + `tw-animate-css` | `animate-in`, `fade-in`, `slide-in-from-*` |

### 2-6. 이번 개편의 핵심 부채

1. **"비유(analogy)" 앰버 강조가 토큰이 아닌 raw `amber-*`로 박혀 있음** → 톤 변경 시 카드 전체를 손봐야 함. `--accent*` 토큰 계열로 정규화 필요.
2. **`shadow-[…oklch(…)…]` 임의값**이 카드·유리박스에 하드코딩 → `--shadow-*` 토큰화 필요.
3. **다크모드 토큰이 흑백 잔재** → design.md가 다크를 요구하면 전면 재정의, 아니면 제거해 혼란 축소.
4. `themeColor` HEX가 배경 토큰과 별도로 관리됨 → 배경 토큰 변경 시 동기화 누락 위험.

---

## 3. 개편 방법론 — 단계 (Phase)

> 각 Phase 종료 시 `npx tsc --noEmit` + `npm run build` 통과 확인. Phase 3~6은 로컬(`localhost:3000`)에서 6개 상태 육안 확인.

| Phase | 이름 | 산출물 | 선행조건 |
|-------|------|--------|----------|
| **P1** | 토큰 정의 | `globals.css` `:root` + `@theme inline` 를 design.md 값으로 치환. `--accent-*`(비유), `--shadow-sm/md/lg`, `--ring` 등 누락 토큰 신설 | design.md §색상·반경·그림자 |
| **P2** | 타이포 교체 | `layout.tsx` `<link>` + `--font-sans/display/serif` 를 design.md 서체로. 웨이트·`word-break` 유지 | design.md §서체 (+ 라이선스 확인) |
| **P3** | 하드코딩 제거 | `result-card.tsx`·`state-panels.tsx` 의 `amber-*`/`yellow-*`/`oklch(...)` → 신설 토큰 유틸로 치환. 시각 결과는 P1 값과 동일하게 유지(리팩터링만) | P1 |
| **P4** | 컴포넌트 리스타일 | 검색바 → 결과카드 → 상태패널 6종 → 셸(헤더/섹션) 순으로 design.md 톤 적용(곡률·그림자·간격·강조 방식) | P3 |
| **P5** | 컬러 스킴 결정 | design.md 지시에 따라: (a) 라이트 유지 → 다크 잔재 토큰 삭제, (b) 다크 추가 → `.dark` + `prefers-color-scheme` 토큰 재정의 + 토글 추가 여부 결정 | design.md §모드 |
| **P6** | 모션 튜닝 | `shake/fade-up/ping-slow` 의 duration·easing·거리감을 새 톤에 맞게. design.md가 "정적/차분"이면 강도 축소, "생동감"이면 유지·강화 | design.md §모션 |
| **P7** | QA & 배포 | §7 체크리스트 → 스크린샷 보고 → `vercel --prod` | P1~P6 |

## 4. 파일별 작업 분해 (Work Breakdown)

| 파일 | Phase | 변경 내용 | 리스크 |
|------|-------|-----------|--------|
| `app/globals.css` | P1,P3,P5,P6 | 토큰 전면 치환, `@theme` 확장, 다크 블록 처리, 키프레임 값 조정 | **중** (전역 영향) — Phase별 커밋으로 롤백 지점 확보 |
| `app/layout.tsx` | P2,P5 | 폰트 `<link>`, `--font-*`, `className="light"`/`colorScheme`/`themeColor` 처리 | 낮음 |
| `components/search-bar.tsx` | P4 | 입력창 곡률·테두리 두께·포커스 링·버튼 톤 | 낮음 |
| `components/result-card.tsx` | P3,P4 | amber 하드코딩 → `--accent-*` 토큰, `shadow-[oklch]` → `--shadow-*`, 헤더 그라디언트·아이콘 링·비유 유리박스 재설계 | **높음** (가장 복잡) |
| `components/state-panels.tsx` | P3,P4 | 6개 패널 아이콘 배경/링/텍스트 색을 토큰으로. Typo·Delayed 앰버 통일 유지 | 중 |
| `components/term-explainer.tsx` | P4 | 헤더 뱃지, sticky 검색 섹션 `backdrop-blur`/배경, 결과 섹션 여백·`min-h` | 낮음 |
| `components/ui/button.tsx` | P4(선택) | variant별 배경·hover·active 미세조정 (design.md가 버튼 스타일 규정 시) | 중 (전 버튼 영향) |
| `components/state-preview-bar.tsx` | P4 or 제거 | §6-D 결정에 따름 | 낮음 |
| `app/page.tsx` | P4(선택) | `<main>` 배경/최소높이만 — 거의 불변 | 낮음 |

## 5. 토큰 매핑표 (design.md 확보 후 확정) — TBD

| 토큰 | 현재값 | design.md 목표값 | 비고 |
|------|--------|------------------|------|
| `--background` | `oklch(0.982 0.012 220)` | `TBD` | |
| `--foreground` | `oklch(0.27 0.03 250)` | `TBD` | |
| `--primary` / `--primary-foreground` | `oklch(0.58 0.13 218)` / `oklch(0.99 0.01 220)` | `TBD` | |
| `--secondary` / `-foreground` | `oklch(0.95 0.02 220)` / `oklch(0.38 0.06 235)` | `TBD` | |
| `--muted` / `-foreground` | `oklch(0.955 0.014 220)` / `oklch(0.55 0.03 240)` | `TBD` | |
| `--accent` / `-foreground` (비유 강조) | `oklch(0.94 0.07 85)` / `oklch(0.42 0.09 68)` | `TBD` | raw `amber-*` 대체 대상 |
| `--destructive` | `oklch(0.6 0.17 22)` | `TBD` | |
| `--border` / `--input` / `--ring` | `oklch(0.9 0.02 225)` / 〃 / `--primary` | `TBD` | |
| `--radius` | `0.625rem` | `TBD` | 파생 배수 유지 여부 확인 |
| `--shadow-sm/md/lg` (신설) | (인라인 `oklch(...)`) | `TBD` | 카드·유리박스 |
| `--font-sans` | Noto Sans KR | `TBD` | |
| `--font-display` | Outfit | `TBD` | |
| `--font-serif` | Gowun Batang | `TBD` | 제목용 |
| 컬러 스킴 | light 강제 | `TBD` (light / dark / both) | P5 분기 |
| 모션 성격 | 중간(shake·fade-up·ping) | `TBD` (정적 / 중간 / 생동) | P6 분기 |

## 6. 결정 필요 사항 (design.md 확보 시 함께 확인)

- **A. 다크모드**: 라이트만? 다크 추가? 둘 다 + 토글? (P5 방향 결정)
- **B. 서체 라이선스/제공처**: Google Fonts로 커버되는가? 커스텀 웹폰트면 self-host 필요(파일 배치·`@font-face`).
- **C. 범위**: `ui/button.tsx` cva variant까지 손댈지, 아니면 앱 컴포넌트 레이어만.
- **D. `state-preview-bar`**: 데모용 상태 전환 툴바 — 프로덕션에 계속 노출할지, 개발 전용으로 숨길지(`process.env.NODE_ENV`).
- **E. 아이콘**: 현재 `lucide-react`. design.md가 아이콘 스타일/세트를 규정하면 교체 여부.
- **F. 로고/파비콘**: `public/icon*.png`, `icon.svg` 갱신 필요 여부.

## 7. QA 체크리스트 (P7)

- [ ] 6개 상태 육안 확인: `initial` / `loading` / `result` / `irrelevant` / `typo` / `error` / `delayed` (state-preview-bar 또는 실검색으로)
- [ ] 결과 카드: 정의/비유/역할 3요소 + 스켈레톤(rerolling) + `source:'fallback'` 뱃지
- [ ] 빈 입력 경고(`animate-shake`) + 포커스 유지
- [ ] 모바일(≤375px)·데스크톱 반응형, `word-break: keep-all` 유지
- [ ] 대비(WCAG AA): 본문/버튼/경고 텍스트 대비비
- [ ] `themeColor` ↔ `--background` 동기화
- [ ] `npx tsc --noEmit` exit 0 / `npm run build` exit 0
- [ ] `localhost:3000` 확인 → `vercel --prod` 배포 → 배포본 `/api/health` 정상

## 8. 커밋 / 롤백 전략

- Phase 단위 커밋: `style(design): P1 토큰 정의` … `P7 배포`. 각 커밋 tsc/build 통과.
- P1(토큰)과 P3(하드코딩 제거)은 "시각 무변화 리팩터링"으로 분리 → 이후 P4 리스타일 diff가 순수 톤 변경만 담기게 함.
- 문제 시 Phase 커밋 단위로 `git revert`.

---

## 부록. design.md에 필요한 항목 (템플릿)

```
## 색상
- 배경 / 표면(카드) / 텍스트(본문·보조)
- 주요색(primary) + 대비 텍스트
- 강조색(accent, "비유" 영역)
- 에러색
- 테두리 / 포커스 링
(HEX 또는 OKLCH, 라이트/다크 각각이면 둘 다)

## 타이포그래피
- 본문 서체 / 제목 서체 / (선택)디스플레이 서체 + 웨이트
- 제공처(Google Fonts / self-host)

## 형태
- 기본 모서리 반경(radius)
- 그림자 단계(sm/md/lg) 성격
- 간격 스케일(촘촘/기본/여유)

## 모드 / 모션
- 라이트 / 다크 / 둘 다(+토글)
- 모션 성격: 정적 / 중간 / 생동감
```
