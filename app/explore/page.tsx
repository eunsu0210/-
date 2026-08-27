import type { Metadata } from 'next'
import { TermExplainer } from '@/components/term-explainer'

export const metadata: Metadata = {
  title: '보안 용어 검색 | 비유로 배우는 보안 사전',
  description:
    '궁금한 보안 용어를 검색하면 한 줄 정의 · 일상 비유 · 실제 역할 3가지로 풀어드려요.',
}

export default function ExplorePage() {
  return (
    <main className="min-h-dvh bg-surface font-inter text-on-surface">
      <TermExplainer />
    </main>
  )
}
