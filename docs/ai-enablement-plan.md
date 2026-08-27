# AI 실서비스 전환 · 개선 계획서 (AI Enablement Plan)

> **문서 버전**: v1.0.0
> **작성일**: 2026-08-27
> **기반 문서**: [PRD.md](../PRD.md) · [development-plan.md](./development-plan.md)
> **범위**: 실제 Google Gemini API 키 도입 후, 인공지능 기반 설명 생성이 안정적으로 동작하도록 하는 개선 작업

---

## 1. 배경 — 왜 이 문서가 필요한가

`development-plan.md` 기준 Sprint 1~4 는 완료로 표기돼 있으나, **실제 Gemini 키를 넣고 검증한 결과 AI 경로가 동작하지 않았다.** 지금까지의 "완료"는 사실상 로컬 사전(`lib/mock-terms.ts`) 폴백만으로 화면이 채워지던 상태였다.

### 1-1. 키 도입 시 드러난 결함 (2026-08-27 진단)

| # | 결함 | 영향 | 원인 |
|---|------|------|------|
| A | 모델 목록이 실존하지 않음 (`gemini-3.5-flash`, `gemini-3.7-flash` 등 조합) + 엔드포인트 `v1` 사용 | 모든 AI 호출 실패 → 항상 폴백 | 코드가 학습 시점 추측값으로 작성됨 |
| B | API 키를 URL 쿼리스트링(`?key=`)으로 전달 | 서버 로그·프록시에 키 평문 노출 위험 | — |
| C | `.gitignore` 가 `.env*.local` 만 무시. `.env` 에 실제 키가 들어 있었고 추적 대상이 될 수 있었음 | **키 유출 위험 (심각)** | 템플릿과 시크릿 파일 분리 안 됨 |
| D | `responseSchema`(느슨한 optional 스키마) 사용 시 flash-lite 계열이 `status`,`term` 만 반환하고 `definition/analogy/role` 누락 | 정상 용어인데도 폴백 처리 | Gemini 구조화 출력 특성 |
| E | 폴백 후보 `gemini-flash-latest` 가 현재 폭주(503)로 **응답까지 50초+** 소요 | 클라이언트 10초 타임아웃까지 대기 후 실패 체감 | 모델 혼잡 |
| F | 서버 측 개별 호출 타임아웃 없음 | 느린 모델 하나가 전체 요청을 지연 | — |

> 참고: 터미널에서 `curl` 로 한글 본문을 보내면 Git Bash 인코딩 때문에 `"피싱"` → `"ǽ"` 처럼 깨진다. **브라우저 → Next.js 경로는 UTF-8 정상**이므로 앱 결함이 아니다. 검증은 Node `fetch` 스크립트로 해야 한다.

---

## 2. Sprint 5 — AI 경로 활성화 & 보안 하드닝 ✅ 완료 (2026-08-27)

| 항목 | 처리 내용 | 상태 |
|------|-----------|------|
| **키 저장 위치 정리** | 실제 키 → `.env.local` (gitignore). `.env` 는 시크릿 제거 후 안내 주석만. `.gitignore` 를 `.env*` + `!.env.example` 로 변경 | ✅ |
| **모델 체인 교체** | 실측 기반 `['gemini-flash-lite-latest', 'gemini-3.6-flash']`. `GEMINI_MODELS` 환경변수로 오버라이드 가능 | ✅ |
| **엔드포인트 / 인증** | `v1` → `v1beta`, 키를 `x-goog-api-key` 헤더로 전달 (URL 노출 제거) | ✅ |
| **구조화 출력 방식** | `responseSchema` 제거 → `responseMimeType:'application/json'` + `systemInstruction` + 프롬프트 지시 + `safeJsonParse`(```json 펜스·잡텍스트 방어) | ✅ |
| **서버 타임아웃** | 모델당 `AbortController` 7초 + 전체 AI 예산 9초 초과 시 폴백 전환 (클라 10초 안에서 안전) | ✅ |
| **관측성** | 모델별 성공/실패/지연(ms) 로그, 응답에 `model` 필드 추가 (`source: 'ai' | 'fallback'` 와 함께) | ✅ |
| **회귀 검증** | `tsc --noEmit` exit 0, `next build` exit 0, `/api/explain` 실측 | ✅ |

### 2-1. 검증 결과 (Node fetch, `http://localhost:3000/api/explain`)

| 입력 | 유형 | 응답 시간 | 결과 |
|------|------|-----------|------|
| SQL 인젝션 (사전 밖) | 정상 | 1.77s | `success` / `ai` / flash-lite |
| 중간자 공격 (사전 밖) | 정상 | 1.64s | `success` / `ai` |
| 제로데이 · DDoS · XSS · 버퍼 오버플로우 · 사회공학 | 정상 | 1.2~1.5s | 전부 `success` / `ai` |
| 떡볶이 | 무관 (PRD 5-2) | 1.02s | `irrelevant` / `ai` |
| 피슁 | 오탈자 (PRD 5-3) | 0.93s | `typo` → `피싱` / `ai` |
| 랜섬웨어 (재생성) | 재시도 (PRD 5-6) | 1.68s | `success`, 다른 비유 생성 |

→ **정상 케이스 전부 3초 이내 SLA 충족. 사전에 없는 용어도 AI가 실시간 생성.**

---

## 3. Sprint 6 — 품질 · 비용 · 신뢰성 (다음 단계, 미착수)

### 3-1. 응답 품질
- [ ] **프롬프트 예시 고정(few-shot)**: 좋은 `analogy` 3~4개를 프롬프트에 박아 톤·길이 편차 축소
- [ ] **길이 가드**: `definition` 40자 초과 / `analogy` 4문장 초과 시 서버에서 1회 재요청 또는 절삭
- [ ] **오탐 보정**: 정상 용어를 `typo`로 잘못 분류하는 경우 대비 — `mock-terms` 의 정식 용어/별칭과 먼저 대조해 확실한 건 AI 판정보다 우선
- [ ] **금칙 처리**: 공격 실습용 페이로드·악성코드 요청은 `irrelevant` 로 유도하는 지시문 추가

### 3-2. 비용 / 레이트리밋
- [ ] **IP 기준 레이트리밋** (`/api/explain`): 예) 분당 20회. Upstash Redis 또는 in-memory 슬라이딩 윈도우
- [ ] **캐시 개선**: 현재 `Map` (프로세스 메모리, 재시작 시 소멸, 무한 증가). → LRU 상한(예: 500) 적용, 선택적으로 지속 캐시(KV)
- [ ] **재생성 남용 방지**: 동일 용어 재생성 횟수 소프트 캡(예: 세션당 5회) — PRD 5-6 은 "기본 무제한"이므로 UX 경고 수준
- [ ] **토큰 사용량 로깅**: `usageMetadata` 를 로그로 남겨 일일 비용 추적

### 3-3. 신뢰성
- [ ] **폴백 사전 확장**: 현재 8개 용어. 자주 검색될 상위 50~100개 보안 용어로 확대 (AI 장애 시 체감 품질 유지)
- [ ] **부분 실패 UX**: `source: 'fallback'` 일 때 결과 카드에 "사전 기반 설명" 미세 표기 (선택)
- [ ] **헬스체크**: `GET /api/explain?health=1` → 모델 1회 핑, 배포 모니터링용

---

## 4. Sprint 7 — 배포 & 운영 (미착수)

- [ ] **환경변수 주입**: 배포 플랫폼(Vercel 등) 프로젝트 설정에 `GEMINI_API_KEY` 등록 (`.env.local` 은 로컬 전용)
- [ ] **키 회전 절차 문서화**: AI Studio에서 재발급 → 플랫폼 env 교체 → 재배포. 유출 시 즉시 폐기
- [ ] **리전/런타임 확인**: `route.ts` 는 `runtime = 'nodejs'`. Edge 전환 시 `AbortController`/타임아웃 동작 재검증
- [ ] **에러 모니터링**: `[Gemini] ⚠️` 경고 로그를 Sentry 등으로 수집, 폴백률 대시보드화
- [ ] **부하 테스트**: 동시 20~50 요청에서 p95 응답시간 및 503 비율 측정
- [ ] **모델 갱신 루틴**: 분기별 `ListModels` 로 신규 flash 계열 확인, 체인 상단 교체 검토

---

## 5. 운영 메모 (현재 상태 기준)

| 항목 | 값 |
|------|-----|
| 기본 모델 | `gemini-flash-lite-latest` (실측 ~1.3s) |
| 품질 폴백 모델 | `gemini-3.6-flash` (~7s) |
| 최종 폴백 | 로컬 사전 `lib/mock-terms.ts` (8개 용어) |
| 키 위치 | `.env.local` → `GEMINI_API_KEY` (gitignore 처리됨) |
| 모델 오버라이드 | `.env.local` 에 `GEMINI_MODELS=a,b,c` |
| 서버 타임아웃 | 모델당 7s / 전체 AI 예산 9s |
| 클라이언트 타임아웃 | 10s (`components/term-explainer.tsx`, PRD 5-5) |
| 응답 필드 | `status`, `term`, `definition`, `analogy`, `role`, `suggestedTerm`, `message`, `source`, `model` |

### 로컬 실행
```bash
npm run dev          # http://localhost:3000  (.env.local 자동 로드)
```

### AI 경로 수동 검증 (한글 인코딩 안전 — Node 사용, curl 금지)
```bash
node -e "fetch('http://localhost:3000/api/explain',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({query:'제로데이'})}).then(r=>r.json()).then(d=>console.log(d.source,d.model,d.definition))"
```
`source: 'ai'` 가 나오면 정상. `fallback` 이면 서버 콘솔의 `[Gemini] ⚠️` 로그 확인.
