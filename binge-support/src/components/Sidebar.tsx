'use client'

import { useEffect, useMemo } from 'react'
import { usePathname, useRouter } from 'next/navigation'

// 아이콘: 가벼운 인라인 SVG (외부 라이브러리 불필요)
function Icon({ d }: { d: string }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d={d} />
    </svg>
  )
}

export default function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()

  // 오늘 날짜 앵커 (dashboard의 날짜 헤더에 id가 있을 때 유용)
  const todayId = useMemo(() => {
    const d = new Date()
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset())
    const key = d.toISOString().slice(0, 10) // YYYY-MM-DD
    return `d-${key}`
  }, [])

  // body 패딩 확보
  useEffect(() => {
    document.body.classList.add('with-sidebar')
    return () => document.body.classList.remove('with-sidebar')
  }, [])

  const NavBtn = ({
    label,
    active,
    onClick,
    children,
  }: {
    label: string
    active?: boolean
    onClick: () => void
    children: React.ReactNode
  }) => (
    <button
      className={`sb-btn ${active ? 'active' : ''}`}
      onClick={onClick}
      aria-label={label}
      title={label}
    >
      {children}
    </button>
  )

  return (
    <>
      {/* 사이드바 */}
      <aside className="sidebar" role="navigation" aria-label="Primary">
        <div className="sb-group">
          <NavBtn label="대시보드" active={pathname?.startsWith('/dashboard')} onClick={() => router.push('/dashboard')}>
            <Icon d="M3 12l9-9 9 9M5 10v10h5v-6h4v6h5V10" />
          </NavBtn>

          <NavBtn label="커뮤니티" active={pathname === '/social'} onClick={() => router.push('/social')}>
            <Icon d="M21 15a4 4 0 0 1-3 3.87V21l-3-1.5a6.5 6.5 0 1 1 6-4.5z" />
          </NavBtn>

          <NavBtn label="휴지통" active={pathname === '/trash'} onClick={() => router.push('/trash')}>
            <Icon d="M3 6h18M8 6V4h8v2m-1 0v14a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2V6" />
          </NavBtn>

          {/* 날짜별 기록(오늘로 점프) */}
          <NavBtn
            label="오늘로 이동"
            onClick={() => {
              if (pathname !== '/dashboard') router.push(`/dashboard#${todayId}`)
              else {
                // 같은 페이지면 스크롤만
                const el = document.getElementById(todayId)
                el?.scrollIntoView({ behavior: 'smooth', block: 'start' })
              }
            }}
          >
            <Icon d="M8 2v4M16 2v4M4 8h16M7 11h5M7 15h10M4 22h16a2 2 0 0 0 2-2V8H2v12a2 2 0 0 0 2 2z" />
          </NavBtn>
        </div>

        {/* 하단 고정 – 프로필/설정/로그아웃 등 확장 가능 */}
        <div className="sb-bottom">
          <NavBtn label="새 기록" onClick={() => router.push('/dashboard#new')}>
            <Icon d="M12 5v14M5 12h14" />
          </NavBtn>
        </div>
      </aside>

      {/* 모바일 토글 버튼 (원하면 제거 가능) */}
      <button
        className="sb-fab"
        onClick={() => document.body.classList.toggle('sidebar-open')}
        aria-label="메뉴 열기/닫기"
      >
        A
      </button>
    </>
  )
}