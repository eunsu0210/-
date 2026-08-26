'use client'

import { useState } from 'react'
import { ChevronDown, FlaskConical } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export type ViewState =
  | 'initial'
  | 'loading'
  | 'result'
  | 'empty'
  | 'irrelevant'
  | 'typo'
  | 'error'
  | 'delayed'

const PREVIEW_STATES: { state: ViewState; label: string }[] = [
  { state: 'initial', label: '초기' },
  { state: 'loading', label: '로딩' },
  { state: 'result', label: '정상 결과' },
  { state: 'empty', label: '입력 없음' },
  { state: 'irrelevant', label: '무관한 용어' },
  { state: 'typo', label: '오탈자 추정' },
  { state: 'error', label: '생성 실패' },
  { state: 'delayed', label: '응답 지연' },
]

type StatePreviewBarProps = {
  current: ViewState
  onSelect: (state: ViewState) => void
}

export function StatePreviewBar({ current, onSelect }: StatePreviewBarProps) {
  const [open, setOpen] = useState(true)

  return (
    <aside className="rounded-2xl border border-dashed border-border bg-secondary/50 p-4">
      <div className="flex items-center justify-between gap-2">
        <p className="flex items-center gap-2 text-xs font-bold text-muted-foreground">
          <FlaskConical className="size-4" aria-hidden="true" />
          상태 미리보기 (데모 · 디자인 리뷰용)
        </p>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setOpen((value) => !value)}
          aria-expanded={open}
          className="rounded-lg text-xs font-bold"
        >
          {open ? '접기' : '펼치기'}
          <ChevronDown
            aria-hidden="true"
            className={cn('size-3.5 transition-transform', open && 'rotate-180')}
          />
        </Button>
      </div>

      {open ? (
        <div className="flex flex-wrap gap-2 pt-3">
          {PREVIEW_STATES.map(({ state, label }) => (
            <Button
              key={state}
              variant={current === state ? 'default' : 'outline'}
              size="sm"
              onClick={() => onSelect(state)}
              className="h-8 rounded-full px-3 text-xs font-bold"
            >
              {label}
            </Button>
          ))}
        </div>
      ) : null}
    </aside>
  )
}
