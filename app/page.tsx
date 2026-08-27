import type { Metadata } from 'next'
import { LandingPage } from '@/components/landing-page'

export const metadata: Metadata = {
  title: '보안 비유 사전 — 어려운 보안, 일상으로 풀다',
  description:
    '외계어 같던 보안 용어를 우리 주변의 친숙한 이야기로. 회원가입 없이 무료로, 정의 · 비유 · 실무 역할 3가지를 3초 안에 확인하세요.',
}

export default function Page() {
  return <LandingPage />
}
