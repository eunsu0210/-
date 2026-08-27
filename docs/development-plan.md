# 보안 용어 쉬운 비유 설명 서비스 — 개발 계획서 (Development Plan)

> **문서 버전**: v1.3.0  
> **최종 수정일**: 2026-08-27 (실제 Gemini 키 도입 후 AI 경로 재정비)  
> **기반 문서**: [PRD.md](../PRD.md) · [ai-enablement-plan.md](./ai-enablement-plan.md)  
> **프로젝트 상태**: ✅ Sprint 1~5 완료 · ✅ Sprint 6 (품질·신뢰성) 완료 · ⬜ Sprint 7 (배포·운영) 예정

> ⚠️ **정정 (2026-08-27)**: Sprint 2 에서 "완료"로 표기했던 Gemini 연동은 실제 키 투입 시 동작하지 않았다
> (존재하지 않는 모델명, `v1` 엔드포인트, 키가 `.gitignore` 밖 `.env` 에 노출 등). 원인·조치·검증 결과는
> [ai-enablement-plan.md](./ai-enablement-plan.md) 참조. 현재는 `gemini-flash-lite-latest` 로 실 AI 응답이
> 1~2초 내 생성되는 것을 확인함.

---

## 1. 개요 (Overview)

본 개발 계획서는 `PRD.md`에 정의된 요구사항을 바탕으로, **보안 전공 초보자 및 교육생을 위한 단일 화면 보안 용어 비유 설명 서비스**를 단계별(스프린트 단위)로 구축하기 위한 구체적인 가이드를 제공합니다.

> **프로젝트 현황**: 2026-08-27 기준 Sprint 1시4 전체 완료. 배포 가능 상태.

---

## 2. 개발 로드맵 및 스프린트 구성

전체 개발 과정은 총 **4개의 스프린트(Sprint)**로 구분하여 추진합니다.

```mermaid
gantt
    title 개발 스프린트 로드맵
    dateFormat  YYYY-MM-DD
    section Sprint 1
    기반 설정 & UI 레이아웃 구축    :done, s1, 2026-08-26, 2026-08-27
    section Sprint 2
    AI 설명 생성 연동 & Core API    :done, s2, 2026-08-27, 2026-08-27
    section Sprint 3
    예외 처리 6종 및 인터랙션 완성  :done, s3, 2026-08-27, 2026-08-27
    section Sprint 4
    UI/UX Polish, 성능 최적화 & 검증:done, s4, 2026-08-27, 2d
```

---

## 3. 스프린트별 상세 계획 (Sprint Specification)

### 🚀 Sprint 1: 프로젝트 기반 설정 & 단일 화면 UI 레이아웃 (Visual Foundation) [완료 ✅]

* **상태**: **완료 (Completed)** (2026-08-27)
* **목표**: 1 Screen 핵심 UI 뼈대 구축, 컴포넌트 모듈화, 빈 입력 예외 처리 UI 구현
* **주요 성과**:
  1. **디자인 시스템 및 레이아웃**:
     - Modern & Premium 다크/글래스모피즘 테마 및 Google Fonts(`Noto Sans KR`, `Outfit`, `Gowun Batang`) 연동 완료
     - 단일 화면 메인 레이아웃 (`app/page.tsx`) 구축
  2. **핵심 UI 컴포넌트 분리**:
     - `SearchBar`: 입력창, 검색 버튼, Enter 키 바인딩 (한글 IME 중복 방지), 포커스 제어
     - `ResultCard`: 용어명, ①한 줄 정의, ②일상 비유 설명, ③보안 역할 설명
     - `StatusIndicator`: 로딩 스피너 및 각 상태(`initial`, `loading`, `irrelevant`, `typo`, `error`, `delayed`) 메시지 패널 통합
  3. **기초 상태 관리**:
     - `idle/initial`, `loading`, `result`, `irrelevant`, `typo`, `error`, `delayed` 상태 연동
  4. **[5-1] 빈 입력 예외 처리**:
     - 빈 입력 시 검색 방지, `"검색어를 입력해주세요"` 안내 문구, `animate-shake` 미세 경고 및 포커스 유지 처리 완료

---

### ⚡ Sprint 2: AI 설명 생성 엔진 & Core API 연동 (Engine & Response) [완료 ✅]

* **상태**: **완료 (Completed)** (2026-08-27)
* **목표**: 입력된 보안 용어를 해석하여 3초 이내 3요소(정의/비유/역할)를 생성해내는 API 연동 및 타임아웃 처리
* **주요 성과**:
  1. **Google Gemini API 연동 설정**:
     - `GEMINI_API_KEY` 환경 변수 구성 및 `gemini-2.5-flash` / `gemini-2.0-flash` 모델 연동
     - API 키 부재 또는 외부 오류 시 로컬 사전(`lib/mock-terms.ts`) 자동 폴백 메커니즘 구축
  2. **API Route 구축 (`/api/explain`)**:
     - 프롬프트 엔지니어링 및 `responseMimeType: 'application/json'` 응답 강제 (① 한 줄 정의, ② 일상 비유 설명, ③ 보안 역할 3요소)
     - 검색어 및 재생성 시드별 인메모리 결과 캐싱(`cacheMap`) 최적화
  3. **[5-5] 응답 지연 및 타임아웃 핸들링**:
     - 3초 경과 시 `"설명을 찾고 있어요…"` 로딩 상태 유지
     - 10초 초과 시 Client AbortController 요청 자동 취소 ➔ `"응답이 지연되고 있어요. 다시 시도해주세요."` 상태 및 재시도 버튼 노출 연동 완료

---

### 🛡️ Sprint 3: 예외 처리 6종 완비 & 인터랙션 구현 (Exception & Resilience) [완료 ✅]

* **상태**: **완료 (Completed)** (2026-08-27)
* **목표**: `PRD.md` 5절에 명시된 6가지 예외 상황을 100% 충실히 처리
* **주요 성과**:
  1. **[5-1] 빈 입력 방지**: 공백 입력 차단, `"검색어를 입력해주세요"` 안내, `animate-shake` 및 포커스 유지.
  2. **[5-2] 보안 무관/미존재 용어**: AI/Fallback 판단으로 `" '떡볶이는' 보안 용어로 보이지 않아요."` 안내 및 추천 용어 칩 (피싱, VPN, 랜섬웨어 등) 클릭 시 즉시 재검색.
  3. **[5-3] 오탈자 보정 및 추천**: 유사 용어 대조 ➔ `"혹시 '피싱을' 찾으시나요?"` 추천 버튼 제시 및 원클릭 자동 보정 재검색.
  4. **[5-4] AI/API 생성 실패 대응**: `ErrorPanel` 에러 상태 전환 및 **[다시 시도]** 버튼을 통해 동일 검색어 손쉬운 재요청.
  5. **[5-5] 응답 지연 및 타임아웃 핸들링**: 10초 `AbortController` 자동 취소 후 `DelayedPanel` 및 **[다시 시도]** 버튼 제공.
  6. **[5-6] 결과 재시도 요구**: 결과 카드 하단 **[다른 설명으로 다시 보기]** 상시 제공 ➔ 동일 용어 AI 재생성/variant 시드 변경 및 로딩 스켈레톤 트랜지션 완료.

---

### ✨ Sprint 4: Visual Polish, 반응형 최적화 & 최종 검증 (Polish & Quality Assurance) [완료 ✅]

* **상태**: **완료 (Completed)** (2026-08-27)
* **목표**: 3초 이내 응답 확인, 모바일/데스크톱 반응형 완벽 대응 및 품질 검증
* **주요 성과**:
  1. **ResultCard Visual Polish**:
     - 비유 섹션: 앰버 그라디언트 글래스모피즘 박스 + `ring-1` 테두리 + 배경 블러 장식 적용
     - 정의/역할 아이콘: `ring-1 ring-primary/15` accent ring으로 깊이감 강화
     - 카드 헤더: `from-primary/8` 그라디언트 배경 + 뱃지형 variant count 표시
     - 카드 호버: `hover:shadow-*` 트랜지션으로 인터랙티브 피드백 제공
  2. **Skeleton UI 구조화**:
     - `isRerolling` 스켈레톤을 단순 muted 박스 → 3요소(정의/비유/역할) 실제 구조 반영 스켈레톤으로 교체
     - 비유 섹션 스켈레톤도 amber 색상 팔레트로 실제 컨텐츠와 색상 일치
  3. **State Panels 마이크로 인터랙션**:
     - TermChips 버튼 `hover:scale-105 active:scale-95` 클릭 피드백 추가
     - LoadingPanel: `animate-ping` 배경 링 → 로딩 중 생동감 강화
     - TypoPanel/DelayedPanel: 앰버 아이콘 테마 통일로 시각적 계층 일관성 확보
     - ErrorPanel/DelayedPanel 재시도 버튼 `hover:border-primary/40 hover:bg-primary/5` 피드백
  4. **CSS 커스텀 키프레임 추가** (`globals.css`):
     - `@keyframes fade-up`: 결과 영역 진입 애니메이션
     - `@keyframes ping-slow`: 로딩 패널 생동감 있는 펄스
  5. **완료 조건 (Checklist) 검증**:
     - [x] 단일 화면에서 3요소(정의/비유/역할) 출력 흐름 검증
     - [x] 회원가입/로그인/결제/DB저장 기능 불필요 검증
     - [x] 예외 처리 6종 전체 동작 검증
     - [x] 3초 이내 빠른 응답 속도 체감 및 타임아웃 동작 검증
     - [x] TypeScript 타입 검사 (`tsc --noEmit`) Exit code 0
     - [x] Next.js 16.3.3 프로덕션 빌드 (`npm run build`) Exit code 0

---

## 4. 관리 및 유지보수 가이드 (Maintenance Plan)

- 본 계획서는 개발 진행 상황에 맞춰 `docs/` 디렉토리 내에서 업데이트됩니다.
- 각 스프린트 완료 시 `walkthrough.md`에 시각적 verification 결과를 기록합니다.

---

## 5. 전체 프로젝트 완료 요약 (Final Status)

> **추진 일자**: 2026-08-26 시작 → 2026-08-27 완료  
> **Git 코미트**: `3707e74` (main 브랜치 푸시 완료)

| 스프린트 | 한 줄 요약 | 상태 |
|----------|------------|------|
| Sprint 1 | 기반 설정 & 단일 화면 UI 레이아웃 | ✅ 완료 |
| Sprint 2 | Gemini AI 연동 & `/api/explain` Route | ✅ 완료 |
| Sprint 3 | 예외 처리 6종 (PRD 5-1시5-6) 완비 | ✅ 완료 |
| Sprint 4 | Visual Polish, Micro-animations & QA 검증 | ✅ 완료 |
| Sprint 5 | 실제 Gemini 키 도입 · AI 경로 활성화 · 시크릿 하드닝 | ✅ 완료 (2026-08-27) |
| Sprint 6 | few-shot·길이가드·오탐보정·레이트리밋·LRU캐시·폴백 사전 8→30·헬스체크 | ✅ 완료 (2026-08-27) |
| Sprint 7 | 배포 환경변수·키 회전·모니터링·부하 테스트 | ⬜ 예정 |

### 파일 구성 (해당 코드)

```
보안 용어 학습기/
├─ app/
│   ├─ page.tsx              # 메인 페이지 (TermExplainer 마운트)
│   ├─ layout.tsx            # 폰트, SEO 메타데이터
│   ├─ globals.css           # 시스템 토큰, 콌러, 애니메이션
│   └─ api/explain/route.ts  # POST /api/explain (Gemini + Fallback)
├─ components/
│   ├─ term-explainer.tsx    # 상태 머신 코어 (runSearch, AbortController)
│   ├─ search-bar.tsx        # 검색창, Enter 키 IME 처리, 빈 입력 경고
│   ├─ result-card.tsx       # 3요소 결과 카드, 스켈레톤, Reroll
│   ├─ state-panels.tsx      # Initial/Loading/Irrelevant/Typo/Error/Delayed
│   └─ state-preview-bar.tsx # 데모용 상태 전환 툴바
├─ lib/
│   ├─ mock-terms.ts         # 로여 Fallback 사전
│   └─ utils.ts              # cn() 헬퍼
└─ docs/
    ├─ development-plan.md   # 본 문서
    └─ (walkthrough.md)      # 스프린트별 검증 결과 기록
```

### 환경 변수

| 변수명 | 설명 | 필수 여부 |
|---------|------|----------|
| `GEMINI_API_KEY` | Google Gemini API 키. **`.env.local` 에 저장** (`.env` 아님 — `.gitignore` 처리됨). `AQ.Ab8...` / `AIza...` 형식 모두 지원 | 선택 (미설정 시 로컬 사전 Fallback 자동 적용) |
| `GEMINI_MODELS` | 모델 우선순위 쉼표 오버라이드. 미설정 시 `gemini-flash-lite-latest,gemini-3.6-flash` | 선택 |

> 템플릿은 `.env.example`. 실제 키는 `.env.local`. 상세 운영 가이드는 [ai-enablement-plan.md](./ai-enablement-plan.md).
