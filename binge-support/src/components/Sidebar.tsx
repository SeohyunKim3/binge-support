'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import {
  CiHome,
  CiChat1,
  CiTrash,
  CiCalendar,
  CiMenuFries, // 햄버거/토글 아이콘
} from 'react-icons/ci'

type Item = {
  key: string
  label: string
  href: string
  icon: React.ReactNode
  preview?: string
}

const items: Item[] = [
  { key: 'home', label: '대시보드', href: '/dashboard', icon: <CiHome size={20} /> },
  { key: 'community', label: '커뮤니티', href: '/social', icon: <CiChat1 size={20} /> },
  { key: 'trash', label: '휴지통', href: '/trash', icon: <CiTrash size={20} /> },
  { key: 'calendar', label: '달력', href: '/calendar', icon: <CiCalendar size={20} /> },
]

export default function Sidebar() {
  const pathname = usePathname()
  const [open, setOpen] = useState(true)
  const [mobileHidden, setMobileHidden] = useState(false)

  // 모바일에서 닫기 동작: 완전히 숨김
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 768px)')
    const initHidden = mq.matches // 모바일이면 기본은 열려있되, 닫기 누르면 완전 숨김
    setMobileHidden(false) // 기본은 보이게
  }, [])

  if (mobileHidden) {
    // 모바일 “다시 열기” 플로팅 탭
    return (
      <button
        aria-label="사이드바 열기"
        onClick={() => setMobileHidden(false)}
        className="sb-reopen"
      >
        <CiMenuFries size={22} />
        <style jsx>{`
          .sb-reopen{
            position: fixed;
            top: 14px;
            left: 14px;
            z-index: 60;
            width: 42px;
            height: 42px;
            border-radius: 9999px;
            border: 1px solid #dfe7e3;
            background: #fff;
            color: #395a4e;
            display:flex;align-items:center;justify-content:center;

          @media(min-width:769px){ .sb-reopen{ display:none; } }
        `}</style>
      </button>
    )
  }

  return (
    <aside className={`sb ${open ? 'open' : 'closed'}`}>
      {/* 상단 토글 버튼 */}
      <button
        className="sb-toggle"
        aria-label={open ? '사이드바 접기' : '사이드바 펼치기'}
        onClick={() => setOpen(!open)}
      >
        <CiMenuFries size={22} />
      </button>

      {/* 네비게이션 */}
      <nav className="sb-nav">
        {items.map((it) => {
          const active = pathname?.startsWith(it.href)
          return (
            <Link key={it.key} href={it.href} className={`sb-item ${active ? 'active' : ''}`}>
              <span className="sb-icon">{it.icon}</span>

              {/* 펼친 상태에서만 텍스트/미리보기 노출 */}
              {open && (
                <span className="sb-text">
                  <span className="sb-label">{it.label}</span>
                  {it.preview && <span className="sb-preview">{it.preview}</span>}
                </span>
              )}

              {/* 접힌 상태 툴팁 */}
              {!open && <span className="sb-tip">{it.label}</span>}
            </Link>
          )
        })}
      </nav>

      {/* 모바일에서 "닫기" 버튼 */}
      <button
        className="sb-mobile-close"
        onClick={() => setMobileHidden(true)}
        aria-label="사이드바 닫기"
      >
        닫기
      </button>

      <style jsx>{`
        :root{
          --sb-bg:#ffffff;
          --sb-border:#e6eee9;
          --sb-icon:#5a736a;
          --sb-icon-light:#82988f;
          --sb-active:#e6f0eb;
          --sb-hover:#eef5f1;
          --sb-shadow:0 6px 20px rgba(0,0,0,.06);
        }
        .sb{
          position: fixed; left:0; top:0; bottom:0;
          width: 72px;  /* 접힌 폭 */
          background: var(--sb-bg);
          border-right: none !important;
          padding: 12px 12px;
          display:flex; flex-direction:column; gap:12px;
          z-index: 50;
          box-shadow: 0 6px 20px rgba(0,0,0,.06); 
        }
        .sb.open{ width: 220px; transition: width .2s ease; }
        .sb.closed{ width: 72px; transition: width .2s ease; }

        .sb-toggle{
          width: 48px; height: 48px; border-radius: 9999px;
          border: 'none';
          background:#fff; color: var(--sb-icon);
          display:flex; align-items:center; justify-content:flex-end;
          margin: 4px 8px;
        }

        .sb-nav{ display:flex; flex-direction:column; gap:8px; margin-top: 8px; }

        .sb-item{
          position: relative;
          display:flex; align-items:center;
          gap:12px;
          padding: 8px;
          border-radius: 14px;
          color: var(--sb-icon);
          text-decoration:none;
        }
        .sb-item:hover{ background: var(--sb-hover); }
        .sb-item.active{ background: var(--sb-active); color:#0e3c2c; }

        .sb-icon{
          min-width:48px; min-height:48px;
          width:48px; height:48px;
          border-radius: 9999px;
          display:flex; align-items:center; justify-content:center;
          border: 1px solid var(--sb-border);
          color: var(--sb-icon);
          background: #fff;
          /* 접힌 상태에서 hover 시 원형만 강조 */
        }
        .sb.closed .sb-item:hover .sb-icon{
          background: var(--sb-active);
          border-color: #dfeae4;
        }

        .sb-text{ display:flex; flex-direction:column; min-width:0; }
        .sb-label{ font-weight:600; color:#2f4a40; }
        .sb-preview{ font-size:12px; color:#7a8b85; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }

        /* 접힌 상태 툴팁 */
        .sb-tip{
          position: absolute; left: 64px; top:50%; transform: translateY(-50%);
          background:#334d43; color:#fff;
          padding:4px 8px; border-radius:8px; font-size:12px;
          opacity:0; pointer-events:none; white-space:nowrap;
          box-shadow: var(--sb-shadow);
        }
        .sb.closed .sb-item:hover .sb-tip{ opacity:1; }

        .sb-mobile-close{
          margin-top: auto;
          align-self:center;
          border: 1px solid var(--sb-border);
          border-radius: 9999px;
          background:#fff; color:#6b7f77;
          padding: 6px 12px; font-size:12px;
        }

        @media(max-width: 768px){
          .sb{ width: 64px; padding:10px 10px; }
          .sb.open{ width: 200px; }
        }


      `}</style>
    </aside>
  )
}