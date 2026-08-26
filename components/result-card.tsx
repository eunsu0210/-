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
}

export function ResultCard({
  term,
  explanation,
  variantIndex,
  variantCount,
  isRerolling,
  onReroll,
}: ResultCardProps) {
  return (
    <article className="overflow-hidden rounded-3xl border border-border bg-card shadow-[0_1px_0_oklch(0.9_0.02_225),0_12px_32px_-24px_oklch(0.5_0.06_240/0.5)]">
      <header className="flex flex-wrap items-end justify-between gap-3 border-b border-border bg-secondary/60 px-6 py-5 sm:px-8">
        <div>
          <p className="text-xs font-bold tracking-widest text-primary uppercase">
            보안 용어
          </p>
          <h2 className="font-serif text-3xl leading-tight text-balance text-card-foreground sm:text-4xl">
            {term}
          </h2>
        </div>
        <p className="text-xs font-medium text-muted-foreground">
          설명 {variantIndex + 1} / {variantCount}
        </p>
      </header>

      <div
        key={isRerolling ? 'loading' : `variant-${variantIndex}`}
        className="flex animate-in flex-col gap-5 p-6 duration-500 fade-in slide-in-from-bottom-2 sm:p-8"
      >
        {isRerolling ? (
          <div className="flex animate-pulse flex-col gap-5" aria-hidden="true">
            <div className="h-16 rounded-2xl bg-muted" />
            <div className="h-36 rounded-2xl bg-accent/60" />
            <div className="h-16 rounded-2xl bg-muted" />
          </div>
        ) : (
          <>
            <section className="flex gap-4">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Sparkles className="size-5" aria-hidden="true" />
              </span>
              <div className="flex flex-col gap-1">
                <h3 className="text-sm font-bold text-muted-foreground">
                  한 줄 정의
                </h3>
                <p className="text-base leading-relaxed text-pretty text-card-foreground">
                  {explanation.definition}
                </p>
              </div>
            </section>

            <section className="rounded-2xl border-2 border-accent-foreground/20 bg-accent/70 p-5 sm:p-6">
              <div className="flex items-center gap-2.5 pb-2">
                <span className="flex size-9 items-center justify-center rounded-xl bg-accent-foreground/10 text-accent-foreground">
                  <Lightbulb className="size-5" aria-hidden="true" />
                </span>
                <h3 className="text-sm font-bold text-accent-foreground">
                  일상 비유로 이해하기
                </h3>
              </div>
              <p className="text-base leading-relaxed text-pretty text-accent-foreground">
                {explanation.analogy}
              </p>
            </section>

            <section className="flex gap-4">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <ShieldCheck className="size-5" aria-hidden="true" />
              </span>
              <div className="flex flex-col gap-1">
                <h3 className="text-sm font-bold text-muted-foreground">
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

      <footer className="border-t border-border bg-secondary/40 px-6 py-4 sm:px-8">
        <Button
          variant="outline"
          onClick={onReroll}
          disabled={isRerolling}
          className="h-11 w-full rounded-xl border-2 text-sm font-bold sm:w-auto"
        >
          {isRerolling ? (
            <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
          ) : (
            <RefreshCw className="size-4" aria-hidden="true" />
          )}
          다른 설명으로 다시 보기
        </Button>
      </footer>
    </article>
  )
}
