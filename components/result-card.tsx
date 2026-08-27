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
    <article className="overflow-hidden rounded-3xl border border-border bg-card shadow-[0_1px_0_oklch(0.9_0.02_225),0_16px_40px_-20px_oklch(0.5_0.08_240/0.35)] transition-shadow duration-300 hover:shadow-[0_1px_0_oklch(0.9_0.02_225),0_20px_48px_-16px_oklch(0.5_0.08_240/0.45)]">
      {/* 카드 헤더 */}
      <header className="flex flex-wrap items-end justify-between gap-3 border-b border-border bg-gradient-to-br from-primary/8 via-secondary/60 to-secondary/30 px-6 py-5 sm:px-8">
        <div>
          <p className="mb-1 flex items-center gap-1.5 text-xs font-bold tracking-widest text-primary uppercase">
            <span className="inline-block size-1.5 rounded-full bg-primary" />
            보안 용어
          </p>
          <h2 className="font-serif text-3xl leading-tight text-balance text-card-foreground sm:text-4xl">
            {term}
          </h2>
        </div>
        <div className="flex flex-col items-end gap-1.5">
          <p className="rounded-full bg-primary/8 px-3 py-1 text-xs font-semibold text-primary">
            설명 {variantIndex + 1} / {variantCount}
          </p>
          {source === 'fallback' ? (
            <span className="rounded-full bg-muted px-2.5 py-0.5 text-[11px] font-medium text-muted-foreground">
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
              <div className="size-10 shrink-0 animate-pulse rounded-xl bg-primary/10" />
              <div className="flex flex-1 flex-col gap-2 pt-1">
                <div className="h-3.5 w-20 animate-pulse rounded-full bg-muted" />
                <div className="h-4 w-full animate-pulse rounded-lg bg-muted" />
                <div className="h-4 w-4/5 animate-pulse rounded-lg bg-muted" />
              </div>
            </div>
            {/* 비유 스켈레톤 */}
            <div className="flex flex-col gap-3 rounded-2xl bg-amber-50/60 p-5 sm:p-6">
              <div className="flex items-center gap-2.5">
                <div className="size-9 animate-pulse rounded-xl bg-amber-200/60" />
                <div className="h-3.5 w-28 animate-pulse rounded-full bg-amber-200/60" />
              </div>
              <div className="flex flex-col gap-1.5">
                <div className="h-4 w-full animate-pulse rounded-lg bg-amber-200/50" />
                <div className="h-4 w-full animate-pulse rounded-lg bg-amber-200/50" />
                <div className="h-4 w-3/4 animate-pulse rounded-lg bg-amber-200/50" />
              </div>
            </div>
            {/* 역할 스켈레톤 */}
            <div className="flex gap-4">
              <div className="size-10 shrink-0 animate-pulse rounded-xl bg-primary/10" />
              <div className="flex flex-1 flex-col gap-2 pt-1">
                <div className="h-3.5 w-32 animate-pulse rounded-full bg-muted" />
                <div className="h-4 w-full animate-pulse rounded-lg bg-muted" />
                <div className="h-4 w-4/5 animate-pulse rounded-lg bg-muted" />
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* ① 한 줄 정의 */}
            <section className="flex gap-4">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary ring-1 ring-primary/15">
                <Sparkles className="size-5" aria-hidden="true" />
              </span>
              <div className="flex flex-col gap-1">
                <h3 className="text-xs font-bold tracking-wide text-muted-foreground uppercase">
                  한 줄 정의
                </h3>
                <p className="text-base leading-relaxed text-pretty text-card-foreground">
                  {explanation.definition}
                </p>
              </div>
            </section>

            {/* ② 일상 비유 설명 — 앰버 글래스모피즘 */}
            <section className="relative overflow-hidden rounded-2xl border border-amber-200/60 bg-gradient-to-br from-amber-50 via-amber-50/80 to-yellow-50/50 p-5 shadow-[inset_0_1px_0_oklch(0.92_0.05_80/0.6)] sm:p-6">
              {/* 배경 장식 */}
              <span
                aria-hidden="true"
                className="pointer-events-none absolute -right-4 -bottom-4 size-24 rounded-full bg-amber-200/25 blur-2xl"
              />
              <div className="relative flex items-center gap-2.5 pb-3">
                <span className="flex size-9 items-center justify-center rounded-xl bg-amber-400/20 text-amber-700 ring-1 ring-amber-300/40">
                  <Lightbulb className="size-5" aria-hidden="true" />
                </span>
                <h3 className="text-sm font-bold text-amber-800">
                  일상 비유로 이해하기
                </h3>
              </div>
              <p className="relative text-base leading-relaxed text-pretty text-amber-900/85">
                {explanation.analogy}
              </p>
            </section>

            {/* ③ 실제 보안에서의 역할 */}
            <section className="flex gap-4">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary ring-1 ring-primary/15">
                <ShieldCheck className="size-5" aria-hidden="true" />
              </span>
              <div className="flex flex-col gap-1">
                <h3 className="text-xs font-bold tracking-wide text-muted-foreground uppercase">
                  실제 보안에서의 역할
                </h3>
                <p className="text-base leading-relaxed text-pretty text-card-foreground">
                  {explanation.role}
                </p>
              </div>
            </section>
          </>
        )}
      </div>

      {/* 카드 푸터 */}
      <footer className="border-t border-border bg-secondary/40 px-6 py-4 sm:px-8">
        <Button
          variant="outline"
          onClick={onReroll}
          disabled={isRerolling}
          className="h-11 w-full rounded-xl border-2 text-sm font-bold transition-all duration-200 hover:border-primary/40 hover:bg-primary/5 hover:text-primary sm:w-auto"
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
