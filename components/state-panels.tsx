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
    <div className="flex animate-in flex-col items-center gap-5 rounded-3xl border border-outline-variant/40 bg-surface-lowest px-6 py-14 text-center shadow-[0px_4px_20px_rgba(26,35,126,0.05)] duration-400 fade-in slide-in-from-bottom-3 sm:px-10">
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
          className="h-9 rounded-full px-4 text-sm font-bold transition-all duration-150 hover:scale-105 hover:bg-mint/10 hover:text-mint active:scale-95"
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
      <span className="flex size-16 items-center justify-center rounded-2xl bg-brand/10 text-brand ring-1 ring-brand/20">
        <BookOpen className="size-8" aria-hidden="true" />
      </span>
      <div className="flex flex-col gap-2">
        <h2 className="text-2xl font-bold tracking-tight text-on-surface">
          보안 용어를 검색해보세요
        </h2>
        <p className="mx-auto max-w-sm text-sm leading-relaxed text-pretty text-on-surface-variant">
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
        className="relative flex size-16 items-center justify-center rounded-2xl bg-brand/10 text-brand ring-1 ring-brand/20"
        aria-hidden="true"
      >
        {/* 배경 펄스 링 */}
        <span className="absolute inset-0 animate-ping rounded-2xl bg-brand/10" />
        <LoaderCircle className="relative size-8 animate-spin" />
      </span>
      <div className="flex flex-col gap-1.5">
        <p
          role="status"
          aria-live="polite"
          className="text-base font-bold text-on-surface"
        >
          설명을 찾고 있어요…
        </p>
        <p className="text-sm text-on-surface-variant">
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
      <span className="flex size-16 items-center justify-center rounded-2xl bg-surface-container text-on-surface-variant ring-1 ring-outline-variant/50">
        <SearchX className="size-8" aria-hidden="true" />
      </span>
      <div className="flex flex-col gap-1.5">
        <p className="max-w-md text-base leading-relaxed text-pretty text-on-surface">
          <span className="font-bold">{`'${formattedWord}'`}</span>
          {' '}보안 용어로 보이지 않아요.{' '}
          <span className="text-on-surface-variant">다른 용어로 다시 검색해보세요.</span>
        </p>
        <p className="text-sm text-on-surface-variant">이런 용어는 어떠세요?</p>
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
      <span className="flex size-16 items-center justify-center rounded-2xl bg-mint-container/30 text-mint ring-1 ring-mint/25">
        <CircleQuestionMark className="size-8" aria-hidden="true" />
      </span>
      <p className="text-lg leading-relaxed text-on-surface">
        혹시 <span className="font-bold text-brand">{`'${formattedSuggestion}'`}</span>
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

export function ErrorPanel({
  onRetry,
  message,
}: {
  onRetry: () => void
  message?: string
}) {
  return (
    <Panel>
      <span className="flex size-16 items-center justify-center rounded-2xl bg-danger/10 text-danger ring-1 ring-danger/20">
        <TriangleAlert className="size-8" aria-hidden="true" />
      </span>
      <div className="flex flex-col gap-1.5">
        <p role="alert" className="text-base font-bold text-on-surface">
          {message ? message : '설명을 불러오지 못했어요.'}
        </p>
        <p className="text-sm text-on-surface-variant">
          {message ? '' : '다시 시도해주세요.'}
        </p>
      </div>
      <Button
        variant="outline"
        onClick={onRetry}
        className="h-11 rounded-xl border-2 px-6 text-sm font-bold transition-all duration-150 hover:border-brand/40 hover:bg-brand/5 hover:text-brand active:scale-[0.98]"
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
      <span className="flex size-16 items-center justify-center rounded-2xl bg-mint-container/30 text-mint ring-1 ring-mint/25">
        <Clock className="size-8" aria-hidden="true" />
      </span>
      <div className="flex flex-col gap-1.5">
        <p role="alert" className="text-base font-bold text-on-surface">
          응답이 지연되고 있어요.
        </p>
        <p className="text-sm text-on-surface-variant">
          네트워크 상태에 따라 시간이 더 걸릴 수 있어요. 다시 시도해주세요.
        </p>
      </div>
      <Button
        variant="outline"
        onClick={onRetry}
        className="h-11 rounded-xl border-2 px-6 text-sm font-bold transition-all duration-150 hover:border-brand/40 hover:bg-brand/5 hover:text-brand active:scale-[0.98]"
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
