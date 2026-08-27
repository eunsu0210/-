import Link from 'next/link'
import {
  ArrowRight,
  Brain,
  CircleCheck,
  CircleX,
  Lightbulb,
  Timer,
  Wrench,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const SERVICE_PATH = '/explore'

/** ── 상단 내비게이션 ─────────────────────────────────────────────── */
function TopNav() {
  return (
    <nav className="sticky top-0 z-50 border-b border-outline-variant/30 bg-surface/85 backdrop-blur-md">
      <div className="mx-auto flex w-full max-w-[1200px] items-center justify-between px-6 py-4">
        <span className="text-xl font-bold tracking-tight text-brand">
          보안 비유 사전
        </span>
        <Link
          href={SERVICE_PATH}
          className="hidden items-center gap-1.5 text-sm font-semibold text-on-surface-variant transition-colors hover:text-mint md:inline-flex"
        >
          용어 검색
          <ArrowRight className="size-4" aria-hidden="true" />
        </Link>
      </div>
    </nav>
  )
}

/** ── Hero ─────────────────────────────────────────────────────────── */
function Hero() {
  return (
    <section className="flex flex-col items-center bg-gradient-to-b from-surface to-surface-low px-6 py-24 text-center sm:py-32">
      <h1 className="mx-auto mb-6 max-w-4xl text-4xl leading-[1.15] font-bold tracking-[-0.02em] text-balance text-brand sm:text-5xl">
        어려운 보안, <span className="text-mint">일상으로 풀다</span>
      </h1>
      <p className="mx-auto mb-10 max-w-2xl text-lg leading-relaxed text-pretty text-on-surface-variant">
        외계어 같던 보안 용어들, 이제 외우지 마세요. 우리 주변의 친숙한 이야기로
        보안 개념의 핵심을 단숨에 이해할 수 있습니다.
      </p>
      <div className="flex flex-col items-center gap-3 sm:flex-row">
        <Link
          href={SERVICE_PATH}
          className="inline-flex h-14 transform items-center justify-center gap-2 rounded-full bg-brand px-10 text-lg font-bold text-white shadow-xl transition-all hover:-translate-y-1 hover:shadow-2xl focus-visible:ring-4 focus-visible:ring-brand/25 focus-visible:outline-none"
        >
          용어 검색하러 가기
          <ArrowRight className="size-5" aria-hidden="true" />
        </Link>
      </div>
      <p className="mt-6 text-sm text-on-surface-variant/80">
        회원가입 없이 바로 · 완전 무료
      </p>
    </section>
  )
}

/** ── 문제 vs 해결 (대비 섹션) ───────────────────────────────────── */
function Contrast() {
  return (
    <section className="bg-surface-lowest px-6 py-24">
      <div className="mx-auto w-full max-w-[1200px]">
        <div className="mb-16 text-center">
          <h2 className="mb-4 text-3xl font-bold tracking-[-0.02em] text-brand sm:text-4xl">
            왜 &lsquo;비유&rsquo; 사전인가요?
          </h2>
          <p className="text-lg text-on-surface-variant">
            우리는 어려운 정의 대신 쉬운 그림을 그려드립니다.
          </p>
        </div>

        <div className="grid grid-cols-1 items-stretch gap-8 md:grid-cols-2 lg:gap-16">
          {/* 기존의 설명 */}
          <div className="flex flex-col rounded-3xl border border-outline-variant/30 bg-surface-container p-8">
            <div className="mb-6 flex items-center gap-3 text-danger">
              <CircleX className="size-8" aria-hidden="true" />
              <span className="text-xl font-bold">기존의 설명</span>
            </div>
            <div className="flex-grow rounded-xl bg-surface-lowest p-6 shadow-sm">
              <h4 className="mb-2 text-lg font-bold text-on-surface">
                방화벽 (Firewall)
              </h4>
              <p className="rounded-lg bg-surface p-4 font-mono text-sm leading-relaxed text-on-surface-variant">
                &ldquo;미리 정의된 보안 규칙에 기반한, 들어오고 나가는 네트워크
                트래픽을 모니터링하고 제어하는 네트워크 보안 시스템입니다…&rdquo;
              </p>
              <p className="mt-6 text-on-surface-variant italic">
                &ldquo;무슨 말인지 한 번에 와닿지 않아요…&rdquo;
              </p>
            </div>
          </div>

          {/* 비유 사전의 설명 */}
          <div className="relative flex flex-col overflow-hidden rounded-3xl border border-brand/20 bg-brand/5 p-8">
            <div
              aria-hidden="true"
              className="absolute -top-8 -right-8 size-32 rounded-bl-full bg-brand/10"
            />
            <div className="z-10 mb-6 flex items-center gap-3 text-brand">
              <CircleCheck className="size-8" aria-hidden="true" />
              <span className="text-xl font-bold">비유 사전의 설명</span>
            </div>
            <div className="z-10 flex-grow rounded-xl border border-brand/10 bg-surface-lowest p-6 shadow-md">
              <h4 className="mb-2 text-lg font-bold text-brand">
                방화벽 (Firewall)
              </h4>
              <p className="rounded-lg border-l-4 border-mint bg-mint/5 p-4 leading-relaxed text-on-surface">
                <span className="font-bold">&ldquo;클럽의 기도(Bouncer)&rdquo;</span>
                <br />
                <br />
                클럽 입구에서 초대장(규칙)이 있는 사람만 들여보내고, 이상한
                사람(악성 트래픽)은 막아내는 덩치 큰 기도 아저씨입니다.
              </p>
              <p className="mt-6 flex items-center gap-2 font-semibold text-mint">
                <Lightbulb className="size-4" aria-hidden="true" />
                아하! 단번에 이해됐어요.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

/** ── 가치 제안 3카드 ─────────────────────────────────────────────── */
const VALUE_PROPS = [
  {
    icon: Brain,
    chip: 'bg-brand/10 text-brand group-hover:bg-brand/20',
    title: '직관적인 비유',
    desc: '딱딱한 정의 대신 우리 주변의 일상적인 상황에 빗대어 설명합니다. 누구나 고개를 끄덕일 수 있는 친숙한 이야기로 보안을 만납니다.',
  },
  {
    icon: Timer,
    chip: 'bg-mint/10 text-mint group-hover:bg-mint/20',
    title: '빠른 이해',
    desc: '방대한 문서 대신 핵심만 짚어냅니다. 3초 이내에 개념의 뼈대를 파악할 수 있도록 간결하고 명확하게 전달합니다.',
  },
  {
    icon: Wrench,
    chip: 'bg-brand-container/10 text-brand-container group-hover:bg-brand-container/20',
    title: '실무적 연결',
    desc: '비유에서 그치지 않습니다. 이해한 개념이 실제 보안 실무에서 어떤 역할을 하는지, 왜 중요한지까지 명쾌하게 짚어줍니다.',
  },
]

function ValueProps() {
  return (
    <section className="bg-surface px-6 py-24">
      <div className="mx-auto w-full max-w-[1200px]">
        <div className="mb-16 text-center">
          <h2 className="text-3xl font-bold tracking-[-0.02em] text-brand sm:text-4xl">
            보안 초보자를 위한 최고의 가이드
          </h2>
        </div>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {VALUE_PROPS.map(({ icon: Icon, chip, title, desc }) => (
            <div
              key={title}
              className="group rounded-2xl border border-surface-variant/50 bg-surface-lowest p-8 shadow-[0px_4px_20px_rgba(26,35,126,0.05)] transition-all hover:border-mint/30 hover:shadow-lg"
            >
              <div
                className={cn(
                  'mb-6 flex size-12 items-center justify-center rounded-xl transition-colors',
                  chip,
                )}
              >
                <Icon className="size-6" aria-hidden="true" />
              </div>
              <h3 className="mb-3 text-2xl font-semibold text-brand">{title}</h3>
              <p className="text-base leading-relaxed text-pretty text-on-surface-variant">
                {desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/** ── 하단 CTA ────────────────────────────────────────────────────── */
function BottomCta() {
  return (
    <section className="relative mt-12 overflow-hidden rounded-t-[3rem] bg-brand px-6 py-24 text-center">
      <div
        aria-hidden="true"
        className="absolute -top-32 -left-32 size-64 rounded-full bg-white/5"
      />
      <div
        aria-hidden="true"
        className="absolute -right-40 -bottom-40 size-80 rounded-full bg-mint/20"
      />
      <div className="relative z-10 mx-auto max-w-3xl">
        <h2 className="mb-6 text-3xl font-bold tracking-[-0.02em] text-balance text-white sm:text-4xl">
          이제 보안이 만만해집니다
        </h2>
        <p className="mb-10 text-lg leading-relaxed text-pretty text-brand-fixed opacity-90">
          더 이상 낯선 용어 앞에서 당황하지 마세요. 비유 사전과 함께라면 당신도
          이미 보안 전문가입니다.
        </p>
        <Link
          href={SERVICE_PATH}
          className="inline-flex h-14 transform items-center justify-center gap-2 rounded-full bg-white px-10 text-lg font-bold text-brand shadow-xl transition-all hover:-translate-y-1 hover:bg-surface-low hover:shadow-2xl focus-visible:ring-4 focus-visible:ring-white/40 focus-visible:outline-none"
        >
          지금 시작하기
          <ArrowRight className="size-5" aria-hidden="true" />
        </Link>
      </div>
    </section>
  )
}

/** ── Footer ──────────────────────────────────────────────────────── */
function Footer() {
  return (
    <footer className="border-t border-surface-variant/30 bg-surface-lowest py-12">
      <div className="mx-auto flex w-full max-w-[1200px] flex-col items-center justify-between gap-4 px-6 md:flex-row">
        <span className="text-sm font-bold text-brand">보안 비유 사전</span>
        <div className="flex gap-6">
          {['Privacy Policy', 'Terms of Service', 'Contact'].map((label) => (
            <a
              key={label}
              href="#"
              className="text-xs text-on-surface-variant opacity-80 transition-opacity hover:text-mint hover:opacity-100"
            >
              {label}
            </a>
          ))}
        </div>
      </div>
    </footer>
  )
}

export function LandingPage() {
  return (
    <div className="flex min-h-dvh flex-col bg-surface font-inter text-on-surface antialiased">
      <TopNav />
      <main className="flex-grow">
        <Hero />
        <Contrast />
        <ValueProps />
        <BottomCta />
      </main>
      <Footer />
    </div>
  )
}
