'use client'

import { useEffect, useMemo, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'

function Icon({ d }: { d: string }) {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d={d} />
    </svg>
  )
}

export default function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const [collapsed, setCollapsed] = useState(false)

  // 오늘 날짜 앵커 (dashboard의 날짜 헤더에 id가 있을 때 사용)
  const todayId = useMemo(() => {
    const d = new Date()
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset())
    return `d-${d.toISOString().slice(0, 10)}`
  }, [])

  // 접힘 상태 복원 + body 클래스 부여
  useEffect(() => {
    const saved = localStorage.getItem('sidebar-collapsed')
    const c = saved === 'true'
    setCollapsed(c)
    document.body.classList.add('with-sidebar')
    document.body.classList.toggle('sidebar-collapsed', c)
    return () => {
      document.body.classList.remove('with-sidebar')
      document.body.classList.remove('sidebar-collapsed')
    }
  }, [])

  const toggleCollapse = () => {
    const next = !collapsed
    setCollapsed(next)
    document.body.classList.toggle('sidebar-collapsed', next)
    localStorage.setItem('sidebar-collapsed', String(next))
  }

  // 공용 버튼
  const NavBtn = ({
    label,
    active,
    onClick,
    icon,
  }: {
    label: string
    active?: boolean
    onClick: () => void
    icon: React.ReactNode
  }) => (
    <button
      className={`sb-btn ${active ? 'active' : ''}`}
      onClick={onClick}
      data-tip={label}
      aria-label={label}
      title={label} /* 보조용(기본 브라우저 툴팁) */
    >
      {icon}
    </button>
  )

  return (
    <aside className="sidebar" role="navigation" aria-label="Primary">
      {/* 맨 위: 접기/펼치기 토글 */}
      <div className="sb-top">
        <button
          className="sb-btn sb-toggle"
          onClick={toggleCollapse}
          data-tip={collapsed ? '사이드바 펼치기' : '사이드바 접기'}
          aria-label={collapsed ? '사이드바 펼치기' : '사이드바 접기'}
          title={collapsed ? '사이드바 펼치기' : '사이드바 접기'}
        >
          {/* chevron-left / right 비슷한 형태 */}
          <Icon d={collapsed ? 'M15 6l-6 6 6 6' : 'M9 6l6 6-6 6'} />
        </button>
      </div>

      {/* 중간: 주요 네비게이션 */}
      <div className="sb-group">
        <NavBtn
          label="대시보드"
          active={pathname?.startsWith('/dashboard')}
          onClick={() => router.push('/dashboard')}
          icon={<Icon d="M3 12l9-9 9 9M5 10v10h5v-6h4v6h5V10" />}
        />
        <NavBtn
          label="커뮤니티"
          active={pathname === '/social'}
          onClick={() => router.push('/social')}
          icon={<Icon d="M21 15a4 4 0 0 1-3 3.87V21l-3-1.5a6.5 6.5 0 1 1 6-4.5z" />}
        />
        <NavBtn
          label="휴지통"
          active={pathname === '/trash'}
          onClick={() => router.push('/trash')}
          icon={<Icon d="M3 6h18M8 6V4h8v2m-1 0v14a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2V6" />}
        />
        <NavBtn
          label="오늘(캘린더)"
          active={false}
          onClick={() => {
            if (pathname !== '/dashboard') {
              router.push(`/dashboard#${todayId}`)
            } else {
              document.getElementById(todayId)?.scrollIntoView({
                behavior: 'smooth',
                block: 'start',
              })
            }
          }}
          icon={<Icon d="M8 2v4M16 2v4M4 8h16M7 11h5M7 15h10M4 22h16a2 2 0 0 0 2-2V8H2v12a2 2 0 0 0 2 2z" />}
        />
      </div>

      {/* 하단 여백만 둠(+ 버튼 제거) */}
      <div className="sb-bottom" />
    </aside>
  )
}