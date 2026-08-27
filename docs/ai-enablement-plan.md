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

## 3. Sprint 6 — 품질 · 비용 · 신뢰성 ✅ 완료 (2026-08-27)

### 3-1. 응답 품질
- [x] **프롬프트 few-shot 고정**: `buildPrompt` 에 좋은 예시 3종(success/irrelevant/typo) 삽입 → 톤·형식 편차 감소
- [x] **길이 가드**: 서버에서 `definition` 60자 / `analogy` 320자 / `role` 220자 초과 시 문장 경계 기준 절삭 (`clampLengths`, `truncate`). 프롬프트 자체도 45/200/140자 지침으로 강화
- [x] **오탐 보정** (`reconcileWithDictionary`): AI가 `typo`/`irrelevant` 로 응답했지만 `findTerm(query)` 이 정확히 일치하면 사전 설명으로 `success` 되돌림
- [x] **금칙 처리**: `SYSTEM_INSTRUCTION` 에 "공격 실습·악성코드 제작·실제 페이로드 요청은 개념 설명만 하거나 irrelevant" 지시 추가
- [x] **긴 입력 방어**: 80자 초과 쿼리는 AI 호출 없이 `"너무 긴 문장이에요…"` 반환

### 3-2. 비용 / 레이트리밋
- [x] **IP 기준 레이트리밋** (`lib/rate-limit.ts`): 인메모리 슬라이딩 윈도우, IP당 60초 20회. 초과 시 `429` + `Retry-After` 헤더 + 친절 메시지
- [x] **LRU 캐시** (`lib/lru-cache.ts`): 무한 증가 `Map` → 상한 500 LRU 로 교체
- [x] **토큰 사용량 로깅**: 성공 응답 로그에 `usageMetadata`(prompt+candidates 토큰) 기록
- [ ] **재생성 소프트 캡**: 세션당 재생성 횟수 경고 — 미착수 (PRD 5-6 "기본 무제한"이라 우선순위 낮음)
- [ ] **지속 캐시(KV)**: 다중 인스턴스 배포 시 필요 — Sprint 7 에서 배포 형태 확정 후 결정

### 3-3. 신뢰성
- [x] **폴백 사전 확장**: `lib/mock-terms.ts` 8개 → **30개** (악성코드·트로이 목마·웜·스파이웨어·백도어·키로거·봇넷·스미싱·파밍·스푸핑·스니핑·XSS·CSRF·SQL 인젝션·무차별 대입·제로 트러스트·샌드박스·해시·전자서명·APT·사회공학·루트킷 등 추가)
- [x] **부분 실패 UX**: `source: 'fallback'` 일 때 `ResultCard` 헤더에 "사전 기반 설명" 뱃지. 레이트리밋 등 API 메시지는 `ErrorPanel` 에 그대로 노출
- [x] **헬스체크**: `GET /api/health` → 기본 모델 1회 핑, `{ok, model, latencyMs, keyConfigured}` 반환

### 3-4. 검증 결과 (2026-08-27, 실 서버)

| 항목 | 결과 |
|------|------|
| `GET /api/health` | `{ok:true, model:"gemini-flash-lite-latest", latencyMs:871}` |
| 신규 사전 용어(봇넷·스미싱·루트킷 등) | 전부 `success`, 1.3~1.8s, 길이 가드 내 |
| 80자 초과 입력 | AI 호출 없이 `"너무 긴 문장이에요…"` 반환 |
| 레이트리밋 | 28회 중 14회 통과 / 14회 `429` + `Retry-After: 52s` |
| `tsc --noEmit` / `next build` | exit 0 (`/api/explain`, `/api/health` 모두 dynamic) |

---

## 4. Sprint 7 — 배포 & 운영 (다음 단계, 미착수)

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
| 최종 폴백 | 로컬 사전 `lib/mock-terms.ts` (30개 용어) |
| 레이트리밋 | IP당 60초 20회 (`lib/rate-limit.ts`) |
| 캐시 | LRU 상한 500 (`lib/lru-cache.ts`) |
| 헬스체크 | `GET /api/health` |
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
