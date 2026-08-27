'use client'

import {
  Lightbulb,
  LoaderCircle,
  RefreshCw,
  ShieldCheck,
  Sparkles,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { Explanation } from '@/lib/mock-terms'

type ResultCardProps = {
  term: string
  explanation: Explanation
  variantIndex: number
  variantCount: number
  isRerolling: boolean
  onReroll: () => void
  source?: 'ai' | 'fallback'
}

export function ResultCard({
  term,
  explanation,
  variantIndex,
  variantCount,
  isRerolling,
  onReroll,
  source,
}: ResultCardProps) {
  return (
    <article className="overflow-hidden rounded-3xl border border-outline-variant/40 bg-surface-lowest shadow-[0px_4px_20px_rgba(26,35,126,0.06)] transition-shadow duration-300 hover:shadow-[0px_10px_32px_rgba(26,35,126,0.1)]">
      {/* 카드 헤더 */}
      <header className="flex flex-wrap items-end justify-between gap-3 border-b border-outline-variant/40 bg-surface-container px-6 py-5 sm:px-8">
        <div>
          <p className="mb-1 flex items-center gap-1.5 text-xs font-bold tracking-widest text-brand uppercase">
            <span className="inline-block size-1.5 rounded-full bg-brand" />
            보안 용어
          </p>
          <h2 className="text-3xl leading-tight font-bold tracking-tight text-balance text-on-surface sm:text-4xl">
            {term}
          </h2>
        </div>
        <div className="flex flex-col items-end gap-1.5">
          <p className="rounded-full bg-brand/10 px-3 py-1 text-xs font-semibold text-brand">
            설명 {variantIndex + 1} / {variantCount}
          </p>
          {source === 'fallback' ? (
            <span className="rounded-full bg-surface-container px-2.5 py-0.5 text-[11px] font-medium text-on-surface-variant">
              사전 기반 설명
            </span>
          ) : null}
        </div>
      </header>

      {/* 카드 본문 */}
      <div
        key={isRerolling ? 'loading' : `variant-${variantIndex}`}
        className="flex animate-in flex-col gap-5 p-6 duration-500 fade-in slide-in-from-bottom-3 sm:p-8"
      >
        {isRerolling ? (
          /* Skeleton UI — 3요소 구조를 그대로 반영 */
          <div className="flex flex-col gap-5" aria-hidden="true">
            {/* 정의 스켈레톤 */}
            <div className="flex gap-4">
              <div className="size-10 shrink-0 animate-pulse rounded-xl bg-brand/10" />
              <div className="flex flex-1 flex-col gap-2 pt-1">
                <div className="h-3.5 w-20 animate-pulse rounded-full bg-surface-container" />
                <div className="h-4 w-full animate-pulse rounded-lg bg-surface-container" />
                <div className="h-4 w-4/5 animate-pulse rounded-lg bg-surface-container" />
              </div>
            </div>
            {/* 비유 스켈레톤 */}
            <div className="flex flex-col gap-3 rounded-2xl bg-mint/[0.06] p-5 sm:p-6">
              <div className="flex items-center gap-2.5">
                <div className="size-9 animate-pulse rounded-xl bg-mint/20" />
                <div className="h-3.5 w-28 animate-pulse rounded-full bg-mint/20" />
              </div>
              <div className="flex flex-col gap-1.5">
                <div className="h-4 w-full animate-pulse rounded-lg bg-mint/15" />
                <div className="h-4 w-full animate-pulse rounded-lg bg-mint/15" />
                <div className="h-4 w-3/4 animate-pulse rounded-lg bg-mint/15" />
              </div>
            </div>
            {/* 역할 스켈레톤 */}
            <div className="flex gap-4">
              <div className="size-10 shrink-0 animate-pulse rounded-xl bg-brand/10" />
              <div className="flex flex-1 flex-col gap-2 pt-1">
                <div className="h-3.5 w-32 animate-pulse rounded-full bg-surface-container" />
                <div className="h-4 w-full animate-pulse rounded-lg bg-surface-container" />
                <div className="h-4 w-4/5 animate-pulse rounded-lg bg-surface-container" />
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* ① 한 줄 정의 */}
            <section className="flex gap-4">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-brand/10 text-brand ring-1 ring-brand/15">
                <Sparkles className="size-5" aria-hidden="true" />
              </span>
              <div className="flex flex-col gap-1">
                <h3 className="text-xs font-bold tracking-wide text-on-surface-variant uppercase">
                  한 줄 정의
                </h3>
                <p className="text-base leading-relaxed text-pretty text-on-surface">
                  {explanation.definition}
                </p>
              </div>
            </section>

            {/* ② 일상 비유 설명 — 민트 강조 박스 */}
            <section className="relative overflow-hidden rounded-2xl border border-mint/25 bg-mint/[0.06] p-5 sm:p-6">
              {/* 배경 장식 */}
              <span
                aria-hidden="true"
                className="pointer-events-none absolute -top-6 -right-6 size-24 rounded-bl-full bg-mint/10"
              />
              <div className="relative flex items-center gap-2.5 pb-3">
                <span className="flex size-9 items-center justify-center rounded-xl bg-mint-container/40 text-mint ring-1 ring-mint/25">
                  <Lightbulb className="size-5" aria-hidden="true" />
                </span>
                <h3 className="text-sm font-bold text-mint">
                  일상 비유로 이해하기
                </h3>
              </div>
              <p className="relative text-base leading-relaxed text-pretty text-on-surface">
                {explanation.analogy}
              </p>
            </section>

            {/* ③ 실제 보안에서의 역할 */}
            <section className="flex gap-4">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-brand/10 text-brand ring-1 ring-brand/15">
                <ShieldCheck className="size-5" aria-hidden="true" />
              </span>
              <div className="flex flex-col gap-1">
                <h3 className="text-xs font-bold tracking-wide text-on-surface-variant uppercase">
                  실제 보안에서의 역할
                </h3>
                <p className="text-base leading-relaxed text-pretty text-on-surface">
                  {explanation.role}
                </p>
              </div>
            </section>
          </>
        )}
      </div>

      {/* 카드 푸터 */}
      <footer className="border-t border-outline-variant/40 bg-surface-container/50 px-6 py-4 sm:px-8">
        <Button
          variant="outline"
          onClick={onReroll}
          disabled={isRerolling}
          className="h-11 w-full rounded-xl border-2 text-sm font-bold transition-all duration-200 hover:border-brand/40 hover:bg-brand/5 hover:text-brand sm:w-auto"
        >
          {isRerolling ? (
            <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
          ) : (
            <RefreshCw className="size-4 transition-transform duration-300 group-hover:rotate-180" aria-hidden="true" />
          )}
          다른 설명으로 다시 보기
        </Button>
      </footer>
    </article>
  )
}
