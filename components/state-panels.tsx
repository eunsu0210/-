'use client'

import {
  BookOpen,
  CircleQuestionMark,
  Clock,
  LoaderCircle,
  RotateCcw,
  SearchX,
  TriangleAlert,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { SUGGESTED_TERMS } from '@/lib/mock-terms'

function Panel({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex animate-in flex-col items-center gap-5 rounded-3xl border border-border bg-card px-6 py-14 text-center duration-400 fade-in slide-in-from-bottom-3 sm:px-10">
      {children}
    </div>
  )
}

function TermChips({ onPick }: { onPick: (term: string) => void }) {
  return (
    <div className="flex flex-wrap justify-center gap-2 pt-1">
      {SUGGESTED_TERMS.slice(0, 3).map((term) => (
        <Button
          key={term}
          variant="secondary"
          onClick={() => onPick(term)}
          className="h-9 rounded-full px-4 text-sm font-bold transition-all duration-150 hover:scale-105 hover:bg-primary/10 hover:text-primary active:scale-95"
        >
          {term}
        </Button>
      ))}
    </div>
  )
}

export function InitialPanel({ onPick }: { onPick: (term: string) => void }) {
  return (
    <Panel>
      <span className="flex size-16 items-center justify-center rounded-2xl bg-primary/10 text-primary ring-1 ring-primary/20">
        <BookOpen className="size-8" aria-hidden="true" />
      </span>
      <div className="flex flex-col gap-2">
        <h2 className="font-serif text-2xl text-card-foreground">
          보안 용어를 검색해보세요
        </h2>
        <p className="mx-auto max-w-sm text-sm leading-relaxed text-pretty text-muted-foreground">
          어려운 용어를 일상 속 비유로 바꿔서 알려드려요. 아래 예시를 눌러 바로
          시작해볼 수도 있어요.
        </p>
      </div>
      <TermChips onPick={onPick} />
    </Panel>
  )
}

export function LoadingPanel() {
  return (
    <Panel>
      <span
        className="relative flex size-16 items-center justify-center rounded-2xl bg-primary/10 text-primary ring-1 ring-primary/20"
        aria-hidden="true"
      >
        {/* 배경 펄스 링 */}
        <span className="absolute inset-0 animate-ping rounded-2xl bg-primary/10" />
        <LoaderCircle className="relative size-8 animate-spin" />
      </span>
      <div className="flex flex-col gap-1.5">
        <p
          role="status"
          aria-live="polite"
          className="text-base font-bold text-card-foreground"
        >
          설명을 찾고 있어요…
        </p>
        <p className="text-sm text-muted-foreground">
          비유로 풀어 쓸 표현을 고르는 중입니다.
        </p>
      </div>
    </Panel>
  )
}

function formatParticle(word: string, type: '은는' | '을를') {
  if (!word) return type === '은는' ? '은(는)' : '을(를)'
  const lastChar = word.charCodeAt(word.length - 1)
  // Hangul Syllables: 0xAC00 ~ 0xD7A3
  if (lastChar >= 0xac00 && lastChar <= 0xd7a3) {
    const hasBatchim = (lastChar - 0xac00) % 28 > 0
    if (type === '은는') return hasBatchim ? `${word}은` : `${word}는`
    if (type === '을를') return hasBatchim ? `${word}을` : `${word}를`
  }
  return type === '은는' ? `${word}은(는)` : `${word}를`
}

export function IrrelevantPanel({
  query,
  onPick,
}: {
  query: string
  onPick: (term: string) => void
}) {
  const formattedWord = formatParticle(query, '은는')
  return (
    <Panel>
      <span className="flex size-16 items-center justify-center rounded-2xl bg-muted text-muted-foreground ring-1 ring-border">
        <SearchX className="size-8" aria-hidden="true" />
      </span>
      <div className="flex flex-col gap-1.5">
        <p className="max-w-md text-base leading-relaxed text-pretty text-card-foreground">
          <span className="font-bold">{`'${formattedWord}'`}</span>
          {' '}보안 용어로 보이지 않아요.{' '}
          <span className="text-muted-foreground">다른 용어로 다시 검색해보세요.</span>
        </p>
        <p className="text-sm text-muted-foreground">이런 용어는 어떠세요?</p>
      </div>
      <TermChips onPick={onPick} />
    </Panel>
  )
}

export function TypoPanel({
  suggestion,
  onConfirm,
}: {
  suggestion: string
  onConfirm: (term: string) => void
}) {
  const formattedSuggestion = formatParticle(suggestion, '을를')
  return (
    <Panel>
      <span className="flex size-16 items-center justify-center rounded-2xl bg-amber-100/80 text-amber-600 ring-1 ring-amber-200/60">
        <CircleQuestionMark className="size-8" aria-hidden="true" />
      </span>
      <p className="text-lg leading-relaxed text-card-foreground">
        혹시 <span className="font-bold text-primary">{`'${formattedSuggestion}'`}</span>
        {' '}찾으시나요?
      </p>
      <Button
        onClick={() => onConfirm(suggestion)}
        className="h-11 rounded-xl px-6 text-sm font-bold transition-all duration-150 hover:scale-[1.02] active:scale-[0.98]"
      >
        네, 맞아요
      </Button>
    </Panel>
  )
}

export function ErrorPanel({ onRetry }: { onRetry: () => void }) {
  return (
    <Panel>
      <span className="flex size-16 items-center justify-center rounded-2xl bg-destructive/10 text-destructive ring-1 ring-destructive/20">
        <TriangleAlert className="size-8" aria-hidden="true" />
      </span>
      <div className="flex flex-col gap-1.5">
        <p role="alert" className="text-base font-bold text-card-foreground">
          설명을 불러오지 못했어요.
        </p>
        <p className="text-sm text-muted-foreground">다시 시도해주세요.</p>
      </div>
      <Button
        variant="outline"
        onClick={onRetry}
        className="h-11 rounded-xl border-2 px-6 text-sm font-bold transition-all duration-150 hover:border-primary/40 hover:bg-primary/5 hover:text-primary active:scale-[0.98]"
      >
        <RotateCcw className="size-4" aria-hidden="true" />
        다시 시도
      </Button>
    </Panel>
  )
}

export function DelayedPanel({ onRetry }: { onRetry: () => void }) {
  return (
    <Panel>
      <span className="flex size-16 items-center justify-center rounded-2xl bg-amber-100/80 text-amber-600 ring-1 ring-amber-200/60">
        <Clock className="size-8" aria-hidden="true" />
      </span>
      <div className="flex flex-col gap-1.5">
        <p role="alert" className="text-base font-bold text-card-foreground">
          응답이 지연되고 있어요.
        </p>
        <p className="text-sm text-muted-foreground">
          네트워크 상태에 따라 시간이 더 걸릴 수 있어요. 다시 시도해주세요.
        </p>
      </div>
      <Button
        variant="outline"
        onClick={onRetry}
        className="h-11 rounded-xl border-2 px-6 text-sm font-bold transition-all duration-150 hover:border-primary/40 hover:bg-primary/5 hover:text-primary active:scale-[0.98]"
      >
        <RotateCcw className="size-4" aria-hidden="true" />
        다시 시도
      </Button>
    </Panel>
  )
}

export type StatusIndicatorProps = {
  status: 'loading' | 'error' | 'delayed'
  onRetry?: () => void
}

export function StatusIndicator({ status, onRetry }: StatusIndicatorProps) {
  if (status === 'loading') {
    return <LoadingPanel />
  }
  if (status === 'delayed') {
    return <DelayedPanel onRetry={onRetry || (() => {})} />
  }
  return <ErrorPanel onRetry={onRetry || (() => {})} />
}
