'use client'

import { useEffect, useMemo, useState } from 'react'
import { usePathname } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import Sidebar from '@/components/Sidebar'
import TransitionProvider from './transition-provider'

const PUBLIC_ROUTES = ['/', '/confirm', '/reset', '/update-password']

export default function Shell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [authed, setAuthed] = useState<boolean | null>(null)

  // 로그인 여부 판단
  useEffect(() => {
    let on = true
    ;(async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (on) setAuthed(!!user)
    })()
    return () => { on = false }
  }, [pathname])

  // 로그인 + 퍼블릭 경로가 아니면 사이드바
  const showSidebar = useMemo(() => {
    if (authed === null) return false
    return authed && !PUBLIC_ROUTES.includes(pathname ?? '')
  }, [authed, pathname])

  // 여백 동기화(사이드바 열림 기억)
  useEffect(() => {
    const open = localStorage.getItem('sb-open') === '1'
    const width = showSidebar ? (open ? '220px' : '0px') : '0px'
    document.documentElement.style.setProperty('--sbw', width)
  }, [showSidebar])

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      {showSidebar && <Sidebar key="sb" />}

      {/* ✅ 본문은 여기서만, 단 한 번 */}
      <main
        id="app-main"
        style={{
          paddingLeft: 'var(--sbw)',
          transition: 'padding-left .25s ease',
          width: '100%',
        }}
      >
        <TransitionProvider>
          {children}
        </TransitionProvider>
      </main>
    </div>
  )
}