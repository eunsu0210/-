# 운영 런북 (Ops Runbook)

> **작성일**: 2026-08-27 · **대상**: 보안 용어 비유 설명 서비스
> **관련**: [ai-enablement-plan.md](./ai-enablement-plan.md) · [development-plan.md](./development-plan.md)

이 문서는 배포·키 관리·장애 대응 절차를 다룬다. 코드 설계 배경은 `ai-enablement-plan.md` 참조.

---

## 1. 배포 시 환경변수 주입

| 변수 | 값 | 비고 |
|------|-----|------|
| `GEMINI_API_KEY` | 실제 키 | **배포 플랫폼의 프로젝트 환경변수**에 등록. `.env.local` 은 로컬 전용이라 배포에 포함되지 않음 |
| `GEMINI_MODELS` | (선택) `gemini-flash-lite-latest,gemini-3.6-flash` | 미설정 시 코드 기본값 |

- Vercel 예시: Project → Settings → Environment Variables → `GEMINI_API_KEY` 추가 (Production/Preview 각각) → **Redeploy** 해야 반영.
- `NEXT_PUBLIC_` 접두사를 **붙이지 말 것**. 붙이면 키가 클라이언트 번들에 인라인되어 노출된다. 서버 전용(`GEMINI_API_KEY`)으로만 사용.
- 키 미설정으로 배포해도 서비스는 죽지 않는다 → 로컬 사전(30개 용어) 폴백으로 동작. `GET /api/health` 가 `mode: "fallback-only"` 로 알려준다.

## 2. 키 회전 절차

1. [Google AI Studio](https://aistudio.google.com/apikey) 에서 **새 키 발급**.
2. 배포 플랫폼 환경변수 `GEMINI_API_KEY` 를 새 키로 교체 → 재배포.
3. `GET /api/health` 로 `ok: true` 및 `latencyMs` 정상 확인.
4. 정상 확인 후 AI Studio 에서 **이전 키 삭제**.
5. 로컬 개발자에게 `.env.local` 갱신 공지.

### 키 유출 의심 시 (긴급)
- 즉시 AI Studio 에서 해당 키 **삭제**(비활성화가 아니라 삭제). → 유출된 키는 그 즉시 무효.
- 새 키 발급 후 위 2~5 진행.
- `.env` / 커밋 로그 / 스크린샷 / 이슈 트래커에 키가 남아있지 않은지 점검. (`git log -p -- .env .env.local` — 현재는 둘 다 `.gitignore` 처리됨)

## 3. 런타임 / 리전 주의사항

- `app/api/explain/route.ts`, `app/api/health/route.ts` 는 `export const runtime = 'nodejs'`.
- **Edge 런타임으로 바꾸지 말 것** 없이 확인 필요: 현재 코드는 `AbortController` + `setTimeout` 기반 모델별 타임아웃(7s)에 의존한다. Edge 에서도 표준 API지만, 전환 시 `scripts/load-test.mjs` 로 타임아웃·폴백 동작을 재검증한 뒤 반영한다.
- 인메모리 상태(`cache` LRU, `rate-limit` 버킷, `metrics` 카운터)는 **인스턴스 로컬**이다. 다중 인스턴스/서버리스 다중 콜드스타트 환경에서는:
  - 레이트리밋이 인스턴스별로 각각 카운트됨 → 전역 제한이 필요하면 Upstash Redis 등으로 교체.
  - `/api/health` 의 `metrics` 는 해당 인스턴스 것만 → 전사 지표는 APM(아래) 사용.

## 4. 모니터링

### 4-1. 지금 바로 되는 것 (외부 의존성 없음)
- `GET /api/health` → `{ ok, model, latencyMs, keyConfigured, metrics }`
  - `metrics.fallbackRate` : 최근 프로세스 기준 폴백 비율. **0.2 초과가 지속되면** Gemini 도달성 문제 신호.
  - `metrics.latencyMs.p95` : 3000(ms) 근처면 SLA 위험.
  - `metrics.rateLimited` : 급증 시 남용 또는 한도 조정 검토.
  - `metrics.reconciled` : AI 오분류를 사전이 되돌린 횟수. 급증 시 프롬프트/모델 점검.
- 서버 로그 grep: `[Gemini] ⚠️` (모델 실패), `[Gemini] ✅ ... tokens:` (토큰 사용량), `[Reconcile]` (오탐 보정).

### 4-2. 권장 (배포 후 연결)
- Sentry 등 에러 트래커에 `[API] /api/explain 오류` 및 반복되는 `[Gemini] ⚠️` 수집.
- `/api/health` 를 uptime 모니터(외부 크론)로 5분 간격 폴링 → `ok: false` 알림.
- 일일 토큰 사용량 집계 → 비용 추적 (로그의 `tokens: a+b` 파싱).

## 5. 장애 대응 플레이북

| 증상 | 즉시 확인 | 조치 |
|------|-----------|------|
| 결과가 전부 "사전 기반 설명" 뱃지 | `GET /api/health` → `ok`, `httpStatus` | 503/401 이면 키 문제 → 키 회전. 503(overload)면 `GEMINI_MODELS` 에 대체 모델 임시 추가 후 재배포 |
| 응답이 느리다 (>3s) | `metrics.latencyMs.p95`, 로그의 모델별 ms | 기본 모델이 느려짐 → `scripts/check-models.mjs` 실행 후 더 빠른 flash 모델로 교체 |
| 429 가 자주 뜬다 | `metrics.rateLimited`, 접속 IP 패턴 | 정상 트래픽이면 `RATE_LIMIT` 상향(route.ts), 남용이면 유지 |
| `401 / API key not valid` | 키 값·공백·따옴표 | env 재입력 후 재배포. 로컬은 `.env.local` |
| 빌드 실패 | `npm run build` 로그 | `next.config.mjs` 의 `typescript.ignoreBuildErrors:true` 때문에 타입 오류는 통과함 → `npx tsc --noEmit` 별도 확인 |

## 6. 정기 점검 (분기 1회)

```bash
node scripts/check-models.mjs      # 신규 flash 모델 등장/지연 확인 → route.ts DEFAULT_MODELS 갱신 검토
node scripts/load-test.mjs 20 10   # 동시 부하에서 p95 및 폴백률 확인
```
- Gemini 모델 세대 교체 주기가 빠르다(2026년 기준 3.x → 3.6/3.7 진행 중). `check-models.mjs` 결과에서 1순위가 바뀌면 체인 상단을 교체한다.
