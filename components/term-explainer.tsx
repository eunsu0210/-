'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { ShieldQuestionMark } from 'lucide-react'
import { ResultCard } from '@/components/result-card'
import { SearchBar } from '@/components/search-bar'
import {
  DelayedPanel,
  ErrorPanel,
  InitialPanel,
  IrrelevantPanel,
  LoadingPanel,
  TypoPanel,
} from '@/components/state-panels'
import { StatePreviewBar, type ViewState } from '@/components/state-preview-bar'
import type { Explanation } from '@/lib/mock-terms'

const TIMEOUT_MS = 10000 // 10초 타임아웃 (PRD 5-5)
const REROLL_DELAY = 500

type ResultData = {
  term: string
  explanation: Explanation
  source?: 'ai' | 'fallback'
}

export function TermExplainer() {
  const [query, setQuery] = useState('')
  const [submitted, setSubmitted] = useState('')
  const [view, setView] = useState<ViewState>('initial')
  const [emptyWarning, setEmptyWarning] = useState(false)
  const [resultData, setResultData] = useState<ResultData | null>(null)
  const [errorMessage, setErrorMessage] = useState('')
  const [suggestion, setSuggestion] = useState('')
  const [variantIndex, setVariantIndex] = useState(0)
  const [isRerolling, setIsRerolling] = useState(false)

  const inputRef = useRef<HTMLInputElement | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  const cancelRequest = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      abortControllerRef.current = null
    }
  }, [])

  useEffect(() => {
    return () => {
      cancelRequest()
    }
  }, [cancelRequest])

  const runSearch = useCallback(
    async (rawQuery: string, options?: { regenerate?: boolean; newIndex?: number }) => {
      const trimmed = rawQuery.trim()

      if (!trimmed) {
        cancelRequest()
        setEmptyWarning(true)
        setIsRerolling(false)
        inputRef.current?.focus()
        return
      }

      cancelRequest()
      setEmptyWarning(false)
      setErrorMessage('')
      setQuery(rawQuery)
      setSubmitted(trimmed)

      const isRegen = Boolean(options?.regenerate)
      if (isRegen) {
        setIsRerolling(true)
      } else {
        setView('loading')
        setIsRerolling(false)
      }

      const controller = new AbortController()
      abortControllerRef.current = controller

      // 10초 타임아웃 타이머 설정 (PRD 5-5)
      const timeoutId = setTimeout(() => {
        if (abortControllerRef.current === controller) {
          controller.abort()
          setView('delayed')
          setIsRerolling(false)
        }
      }, TIMEOUT_MS)

      const reqIndex = options?.newIndex ?? (isRegen ? variantIndex + 1 : 0)

      try {
        const response = await fetch('/api/explain', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            query: trimmed,
            regenerate: isRegen,
            variantIndex: reqIndex,
          }),
          signal: controller.signal,
        })

        clearTimeout(timeoutId)

        const data = await response.json().catch(() => null)

        if (!response.ok) {
          setErrorMessage(data?.message || '')
          setView('error')
          setIsRerolling(false)
          return
        }

        if (data.status === 'success' && data.term && data.definition && data.analogy && data.role) {
          setResultData({
            term: data.term,
            explanation: {
              definition: data.definition,
              analogy: data.analogy,
              role: data.role,
            },
            source: data.source,
          })
          setVariantIndex(reqIndex)
          setView('result')
        } else if (data.status === 'typo' && data.suggestedTerm) {
          setSuggestion(data.suggestedTerm)
          setView('typo')
        } else if (data.status === 'irrelevant') {
          setView('irrelevant')
        } else {
          setView('error')
        }
      } catch (err: any) {
        clearTimeout(timeoutId)
        if (err.name === 'AbortError') {
          // 타임아웃에 의해 이미 setView('delayed') 처리됨
          return
        }
        console.error('Search request failed:', err)
        setView('error')
      } finally {
        setIsRerolling(false)
      }
    },
    [cancelRequest, variantIndex]
  )

  const handleReroll = useCallback(() => {
    if (!submitted) return
    runSearch(submitted, { regenerate: true })
  }, [runSearch, submitted])

  const handlePreview = useCallback(
    (state: ViewState) => {
      cancelRequest()
      setIsRerolling(false)
      setEmptyWarning(false)

      switch (state) {
        case 'initial':
          setQuery('')
          setSubmitted('')
          setView('initial')
          break
        case 'loading':
          setView('loading')
          break
        case 'result':
          runSearch('피싱')
          break
        case 'empty':
          setQuery('')
          setView('initial')
          runSearch('')
          break
        case 'irrelevant':
          setQuery('떡볶이')
          setSubmitted('떡볶이')
          setView('irrelevant')
          break
        case 'typo':
          setQuery('피슁')
          setSubmitted('피슁')
          setSuggestion('피싱')
          setView('typo')
          break
        case 'error':
          setView('error')
          break
        case 'delayed':
          setView('delayed')
          break
      }
    },
    [cancelRequest, runSearch]
  )

  // 디자인 리뷰용: /explore?state=result|error|typo|irrelevant|delayed|loading
  // (개발 환경에서만 동작 — 프로덕션 빌드에서는 무시)
  useEffect(() => {
    if (process.env.NODE_ENV === 'production') return
    const s = new URLSearchParams(window.location.search).get('state')
    if (s) handlePreview(s as ViewState)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-10 font-inter sm:px-6 sm:py-14">
      <header className="flex flex-col items-start gap-3">
        <span className="flex items-center gap-2 rounded-full bg-brand/10 px-3 py-1.5 text-xs font-bold text-brand">
          <ShieldQuestionMark className="size-4" aria-hidden="true" />
          보안 입문자를 위한 비유 사전
        </span>
        <h1 className="text-3xl leading-tight font-bold tracking-tight text-balance text-on-surface sm:text-4xl">
          어려운 보안 용어, <span className="text-mint">아는 이야기</span>로 바꿔서
          알려드려요
        </h1>
      </header>

      <section
        aria-label="용어 검색"
        className="sticky top-0 z-10 -mx-4 bg-surface/85 px-4 pt-4 pb-1 backdrop-blur-md sm:-mx-6 sm:px-6"
      >
        <SearchBar
          value={query}
          onChange={(value) => {
            setQuery(value)
            if (value.trim()) setEmptyWarning(false)
          }}
          onSearch={() => runSearch(query)}
          showEmptyWarning={emptyWarning}
          isBusy={view === 'loading'}
          inputRef={inputRef}
        />
      </section>

      <section aria-label="검색 결과" aria-live="polite" className="min-h-80">
        {view === 'initial' ? (
          <InitialPanel onPick={(term) => runSearch(term)} />
        ) : null}

        {view === 'loading' ? <LoadingPanel /> : null}

        {view === 'result' && resultData ? (
          <ResultCard
            term={resultData.term}
            explanation={resultData.explanation}
            variantIndex={variantIndex}
            variantCount={variantIndex + 1}
            isRerolling={isRerolling}
            onReroll={handleReroll}
            source={resultData.source}
          />
        ) : null}

        {view === 'irrelevant' ? (
          <IrrelevantPanel
            query={submitted}
            onPick={(term) => runSearch(term)}
          />
        ) : null}

        {view === 'typo' ? (
          <TypoPanel
            suggestion={suggestion}
            onConfirm={(term) => runSearch(term)}
          />
        ) : null}

        {view === 'error' ? (
          <ErrorPanel message={errorMessage} onRetry={() => runSearch(submitted)} />
        ) : null}

        {view === 'delayed' ? (
          <DelayedPanel onRetry={() => runSearch(submitted)} />
        ) : null}
      </section>

      <StatePreviewBar current={view} onSelect={handlePreview} />
    </div>
  )
}

