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
    <div className="flex animate-in flex-col items-center gap-4 rounded-3xl border border-border bg-card px-6 py-14 text-center duration-500 fade-in slide-in-from-bottom-2 sm:px-10">
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
          className="h-9 rounded-full px-4 text-sm font-bold"
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
      <span className="flex size-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
        <BookOpen className="size-8" aria-hidden="true" />
      </span>
      <div className="flex flex-col gap-1">
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
        className="flex size-16 items-center justify-center rounded-2xl bg-primary/10 text-primary"
        aria-hidden="true"
      >
        <LoaderCircle className="size-8 animate-spin" />
      </span>
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
    </Panel>
  )
}

export function IrrelevantPanel({
  query,
  onPick,
}: {
  query: string
  onPick: (term: string) => void
}) {
  return (
    <Panel>
      <span className="flex size-16 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
        <SearchX className="size-8" aria-hidden="true" />
      </span>
      <p className="max-w-md text-base leading-relaxed text-pretty text-card-foreground">
        <span className="font-bold">{`'${query}'`}</span>
        은(는) 보안 용어로 보이지 않아요. 다른 용어로 다시 검색해보세요.
      </p>
      <p className="text-sm text-muted-foreground">이런 용어는 어떠세요?</p>
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
  return (
    <Panel>
      <span className="flex size-16 items-center justify-center rounded-2xl bg-accent text-accent-foreground">
        <CircleQuestionMark className="size-8" aria-hidden="true" />
      </span>
      <p className="text-lg leading-relaxed text-card-foreground">
        혹시 <span className="font-bold text-primary">{`'${suggestion}'`}</span>
        를 찾으시나요?
      </p>
      <Button
        onClick={() => onConfirm(suggestion)}
        className="h-11 rounded-xl px-6 text-sm font-bold"
      >
        네, 맞아요
      </Button>
    </Panel>
  )
}

export function ErrorPanel({ onRetry }: { onRetry: () => void }) {
  return (
    <Panel>
      <span className="flex size-16 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
        <TriangleAlert className="size-8" aria-hidden="true" />
      </span>
      <p role="alert" className="text-base font-bold text-card-foreground">
        설명을 불러오지 못했어요. 다시 시도해주세요.
      </p>
      <Button
        variant="outline"
        onClick={onRetry}
        className="h-11 rounded-xl border-2 px-6 text-sm font-bold"
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
      <span className="flex size-16 items-center justify-center rounded-2xl bg-accent text-accent-foreground">
        <Clock className="size-8" aria-hidden="true" />
      </span>
      <p role="alert" className="text-base font-bold text-card-foreground">
        응답이 지연되고 있어요. 다시 시도해주세요.
      </p>
      <p className="text-sm text-muted-foreground">
        네트워크 상태에 따라 시간이 더 걸릴 수 있어요.
      </p>
      <Button
        variant="outline"
        onClick={onRetry}
        className="h-11 rounded-xl border-2 px-6 text-sm font-bold"
      >
        <RotateCcw className="size-4" aria-hidden="true" />
        다시 시도
      </Button>
    </Panel>
  )
}
