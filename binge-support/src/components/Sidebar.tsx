'use client'

import { useEffect, useMemo, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'

type SidebarStats = {
  dashboardCount?: number
  communityCount?: number
  trashCount?: number
  todayLabel?: string
}

export default function Sidebar({ stats }: { stats?: SidebarStats }) {
  const pathname = usePathname()
  const router = useRouter()
  const [expanded, setExpanded] = useState(false)

  // 오늘 앵커 id (대시보드 날짜 헤더에 id가 있어야 스크롤)
  const todayId = useMemo(() => {
    const d = new Date()
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset())
    return `d-${d.toISOString().slice(0, 10)}`
  }, [])

  useEffect(() => {
    const saved = localStorage.getItem('sidebar-expanded')
    const isOpen = saved === 'true'
    setExpanded(isOpen)
    document.body.classList.add('with-sidebar')
    document.body.classList.toggle('sidebar-expanded', isOpen)
    return () => {
      document.body.classList.remove('with-sidebar')
      document.body.classList.remove('sidebar-expanded')
    }
  }, [])

  const toggleExpand = () => {
    const next = !expanded
    setExpanded(next)
    document.body.classList.toggle('sidebar-expanded', next)
    localStorage.setItem('sidebar-expanded', String(next))
  }

  const goToday = () => {
    if (pathname !== '/dashboard') {
      router.push(`/dashboard#${todayId}`)
    } else {
      document.getElementById(todayId)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  // 공통 아이콘
  const I = {
    chevronL: 'M15 6l-6 6 6 6',
    chevronR: 'M9 6l6 6-6 6',
    home: 'M3 12l9-9 9 9M5 10v10h5v-6h4v6h5V10',
    chat: 'M21 15a4 4 0 0 1-3 3.87V21l-3-1.5a6.5 6.5 0 1 1 6-4.5z',
    trash: 'M3 6h18M8 6V4h8v2m-1 0v14a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2V6',
    cal: 'M8 2v4M16 2v4M4 8h16M7 11h5M7 15h10M4 22h16a2 2 0 0 0 2-2V8H2v12a2 2 0 0 0 2 2z',
  }

  const Btn = ({
    active,
    label,
    meta,
    onClick,
    path,
    d,
  }: {
    active?: boolean
    label: string
    meta?: string
    onClick?: () => void
    path?: string
    d: string
  }) => (
    <button
      className={`sb-item ${active ? 'active' : ''}`}
      onClick={onClick}
      aria-current={active ? 'page' : undefined}
      data-tip={label}
      title={label}
    >
      <span className="sb-ico" aria-hidden>
        <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d={d} />
        </svg>
      </span>

      {/* 확장 상태에서만 텍스트/미리보기 노출 */}
      <span className="sb-text">
        <span className="sb-label">{label}</span>
        {meta ? <span className="sb-meta">{meta}</span> : null}
      </span>
    </button>
  )

  return (
    <aside className="sidebar" role="navigation" aria-label="Primary">
      {/* 상단: 확장/축소 토글 (항상 상단 정렬) */}
      <div className="sb-top">
        <button
          className="sb-item sb-toggle"
          onClick={toggleExpand}
          data-tip={expanded ? '사이드바 접기' : '사이드바 펼치기'}
          title={expanded ? '사이드바 접기' : '사이드바 펼치기'}
        >
          <span className="sb-ico" aria-hidden>
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d={expanded ? I.chevronL : I.chevronR} />
            </svg>
          </span>
          <span className="sb-text">
            <span className="sb-label">{expanded ? '접기' : '펼치기'}</span>
          </span>
        </button>
      </div>

      {/* 네비게이션 (상단 정렬 유지) */}
      <nav className="sb-group" aria-label="Main">
        <Btn
          d={I.home}
          label="대시보드"
          meta={typeof stats?.dashboardCount === 'number' ? `오늘 ${stats!.dashboardCount}개` : undefined}
          active={pathname?.startsWith('/dashboard')}
          onClick={() => router.push('/dashboard')}
        />
        <Btn
          d={I.chat}
          label="커뮤니티"
          meta={typeof stats?.communityCount === 'number' ? `새 글 ${stats!.communityCount}` : undefined}
          active={pathname === '/social'}
          onClick={() => router.push('/social')}
        />
        <Btn
          d={I.trash}
          label="휴지통"
          meta={typeof stats?.trashCount === 'number' ? `${stats!.trashCount}개 보관` : undefined}
          active={pathname === '/trash'}
          onClick={() => router.push('/trash')}
        />
        <Btn
          d={I.cal}
          label="오늘로 이동"
          meta={stats?.todayLabel ?? ''}
          onClick={goToday}
        />
      </nav>

      {/* 하단 여백 */}
      <div className="sb-bottom" />
    </aside>
  )
}