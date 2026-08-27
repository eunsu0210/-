'use client'

import type { RefObject } from 'react'
import { CircleAlert, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

type SearchBarProps = {
  value: string
  onChange: (value: string) => void
  onSearch: () => void
  showEmptyWarning: boolean
  isBusy: boolean
  inputRef: RefObject<HTMLInputElement | null>
}

export function SearchBar({
  value,
  onChange,
  onSearch,
  showEmptyWarning,
  isBusy,
  inputRef,
}: SearchBarProps) {
  return (
    <div className="w-full">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search
            aria-hidden="true"
            className="pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-on-surface-variant"
          />
          <input
            ref={inputRef}
            type="text"
            value={value}
            onChange={(event) => onChange(event.target.value)}
            onKeyDown={(event) => {
              if (
                event.key === 'Enter' &&
                !event.nativeEvent.isComposing &&
                event.keyCode !== 229
              ) {
                event.preventDefault()
                onSearch()
              }
            }}
            aria-label="보안 용어 검색"
            aria-invalid={showEmptyWarning}
            aria-describedby={showEmptyWarning ? 'search-warning' : undefined}
            placeholder="궁금한 보안 용어를 입력하세요 (예: 피싱, VPN)"
            className={cn(
              'h-14 w-full rounded-2xl border-2 border-outline-variant/50 bg-surface-lowest pl-12 pr-4 text-base text-on-surface shadow-sm outline-none transition-all placeholder:text-on-surface-variant/70 focus:border-brand focus:ring-4 focus:ring-brand/15',
              showEmptyWarning &&
                'border-danger bg-danger/5 ring-4 ring-danger/15 animate-shake',
            )}
          />
        </div>

        <Button
          onClick={onSearch}
          disabled={isBusy}
          className="h-14 shrink-0 rounded-2xl px-7 text-base font-bold shadow-sm sm:w-auto"
        >
          <Search className="size-5" aria-hidden="true" />
          검색
        </Button>
      </div>

      <div className="min-h-6 pt-2 pl-1">
        {showEmptyWarning ? (
          <p
            id="search-warning"
            role="alert"
            className="flex animate-in items-center gap-1.5 text-sm font-medium text-danger fade-in slide-in-from-top-1"
          >
            <CircleAlert className="size-4" aria-hidden="true" />
            검색어를 입력해주세요
          </p>
        ) : null}
      </div>
    </div>
  )
}
