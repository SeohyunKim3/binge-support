'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { usePathname } from 'next/navigation';

type Stats = {
  dashboardCount?: number;
  communityCount?: number;
  trashCount?: number;
  todayLabel?: string;
};

type Props = {
  stats?: Stats;
};

export default function Sidebar({ stats }: Props) {
  const pathname = usePathname();

  // 화면 폭 감지 (모바일이면 기본 접힘)
  const [isMobile, setIsMobile] = useState(false);
  const [collapsed, setCollapsed] = useState(false); // 접힘(아이콘만)
  const [hidden, setHidden] = useState(false);       // 모바일에서 완전히 숨김

  useEffect(() => {
    const mql = window.matchMedia('(max-width: 768px)');
    const set = () => setIsMobile(mql.matches);
    set();
    mql.addEventListener('change', set);
    return () => mql.removeEventListener('change', set);
  }, []);

  // 초기 상태: 데스크탑은 펼침, 모바일은 완전 숨김
  useEffect(() => {
    const saved = localStorage.getItem('sb-collapsed');
    const savedHidden = localStorage.getItem('sb-hidden');
    if (savedHidden !== null) {
      setHidden(savedHidden === 'true');
    } else {
      setHidden(isMobile); // 모바일 최초 로드에서 완전 숨김
    }
    if (saved !== null) {
      setCollapsed(saved === 'true');
    } else {
      setCollapsed(isMobile); // 모바일이면 접힘으로 시작
    }
  }, [isMobile]);

  // 레이아웃 여백을 CSS 변수로 노출 (#page에 margin-left 주기 위함)
  useEffect(() => {
    const width = hidden ? 0 : collapsed ? 72 : 240;
    document.documentElement.style.setProperty('--sb-w', `${width}px`);
  }, [collapsed, hidden]);

  useEffect(() => {
    localStorage.setItem('sb-collapsed', String(collapsed));
  }, [collapsed]);

  useEffect(() => {
    localStorage.setItem('sb-hidden', String(hidden));
  }, [hidden]);

  const items = useMemo(
    () => [
      {
        key: 'dashboard',
        label: '대시보드',
        href: '/dashboard',
        preview: stats?.dashboardCount ? `오늘 ${stats.dashboardCount}개` : '',
        icon: <HomeIcon />,
      },
      {
        key: 'social',
        label: '커뮤니티',
        href: '/social',
        preview: stats?.communityCount ? `새 글 ${stats.communityCount}` : '',
        icon: <ChatIcon />,
      },
      {
        key: 'trash',
        label: '휴지통',
        href: '/trash',
        preview: stats?.trashCount ? `${stats.trashCount}개` : '',
        icon: <TrashIcon />,
      },
      {
        key: 'calendar',
        label: '오늘로 이동',
        href: '/dashboard#today',
        preview: stats?.todayLabel ?? '',
        icon: <CalendarIcon />,
        onClick: (e: React.MouseEvent) => {
          // 날짜 헤더가 id="d-YYYY-MM-DD" 형태면 거기로 스크롤
          const today = new Date();
          const y = today.getFullYear();
          const m = String(today.getMonth() + 1).padStart(2, '0');
          const d = String(today.getDate()).padStart(2, '0');
          const el =
            document.getElementById(`d-${y}-${m}-${d}`) ||
            document.getElementById('today');
          if (el) {
            e.preventDefault();
            el.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        },
      },
    ],
    [stats]
  );

  // 현재 경로로 활성 상태 결정
  const isActive = (href: string) =>
    href !== '/' && pathname?.startsWith(href.split('#')[0]);

  // 모바일에서 완전 숨김이면 떠 있는 오픈 버튼만
  if (hidden && isMobile) {
    return (
      <>
        <button
          className="fabOpen"
          aria-label="사이드바 열기"
          onClick={() => setHidden(false)}
        >
          <ChevronRight />
        </button>
        <style jsx>{fabCSS}</style>
      </>
    );
  }

  return (
    <>
      <aside
        className={[
          'sidebar',
          collapsed ? 'is-collapsed' : 'is-expanded',
          hidden ? 'is-hidden' : '',
        ].join(' ')}
        aria-label="주요 탐색"
        aria-expanded={!collapsed}
      >
        {/* 상단 토글 그룹 */}
        <div className="top">
          <button
            className="toggle"
            aria-label={collapsed ? '사이드바 펼치기' : '사이드바 접기'}
            onClick={() => setCollapsed((v) => !v)}
            title={collapsed ? '펼치기' : '접기'}
          >
            {collapsed ? <ChevronRight /> : <ChevronLeft />}
          </button>

          {/* 모바일에서 완전히 숨김 */}
          {isMobile && (
            <button
              className="toggle hide"
              aria-label="사이드바 숨기기"
              onClick={() => setHidden(true)}
              title="숨기기"
            >
              <CloseIcon />
            </button>
          )}
        </div>

        {/* 네비게이션 */}
        <nav className="nav" aria-label="기본 메뉴">
          {items.map((it) => (
            <Link
              key={it.key}
              href={it.href}
              className={[
                'itemBtn',
                isActive(it.href) ? 'active' : '',
                collapsed ? 'mode-compact' : 'mode-wide',
              ].join(' ')}
              onClick={it.onClick as any}
            >
              {/* 원형 링 + 아이콘 */}
              <span
                className={[
                  'ring',
                  isActive(it.href) ? 'ring-active' : '',
                ].join(' ')}
              >
                <span className="ico">{it.icon}</span>
              </span>

              {/* 펼친 상태에서만 라벨/미리보기 */}
              {!collapsed && (
                <>
                  <span className="label">{it.label}</span>
                  <span className="preview">{it.preview}</span>
                </>
              )}

              {/* 접힘 + hover 툴팁 */}
              {collapsed && (
                <span className="tooltip" role="tooltip">
                  {it.label}
                </span>
              )}
            </Link>
          ))}
        </nav>
      </aside>

      {/* 페이지 본문 여백 */}
      <style jsx>{styles}</style>
      <style jsx global>{globalPad}</style>
    </>
  );
}

/* ---------- Icons (모두 같은 뷰박스/스트로크로 중앙정렬) ---------- */

function HomeIcon() {
  return (
    <svg viewBox="0 0 24 24" className="svgi" aria-hidden>
      <path
        d="M3 10.5 12 3l9 7.5V21a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1v-10.5Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
function ChatIcon() {
  return (
    <svg viewBox="0 0 24 24" className="svgi" aria-hidden>
      <path
        d="M4 4h16v11H9l-5 5V4Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
function TrashIcon() {
  return (
    <svg viewBox="0 0 24 24" className="svgi" aria-hidden>
      <path
        d="M4 7h16M9 7V4h6v3m-9 0v12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2V7"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
function CalendarIcon() {
  return (
    <svg viewBox="0 0 24 24" className="svgi" aria-hidden>
      <path
        d="M7 2v3m10-3v3M3 8h18M5 5h14a2 2 0 0 1 2 2v13H3V7a2 2 0 0 1 2-2Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
function ChevronRight() {
  return (
    <svg viewBox="0 0 24 24" className="svgi" aria-hidden>
      <path
        d="m9 6 6 6-6 6"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
function ChevronLeft() {
  return (
    <svg viewBox="0 0 24 24" className="svgi" aria-hidden>
      <path
        d="m15 6-6 6 6 6"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
function CloseIcon() {
  return (
    <svg viewBox="0 0 24 24" className="svgi" aria-hidden>
      <path
        d="M6 6l12 12M18 6 6 18"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

/* ---------- CSS ---------- */

const INK = `
  --ink-1: #0e221c;   /* 아주 진한 */
  --ink-2: #335a4e;
  --ink-3: #6c8a80;   /* 기본 아이콘 */
  --ink-4: #a7b9b3;   /* 비활성 */
  --ring:  #e8f3ef;   /* 원형 배경 hover */
  --mint:  #7fb8a6;   /* 포커스 라인 */
  --active:#0f5a45;   /* 활성 아이콘 */
  --bg:    #ffffff;
`;

const styles = (
  <style jsx>{`
    ${INK}

    .sidebar {
      position: fixed;
      inset: 0 auto 0 0;
      width: 240px;
      background: var(--bg);
      border-right: 1px solid #e9eceb;
      display: flex;
      flex-direction: column;
      padding: 16px 12px;
      z-index: 60;
      transition: width 180ms ease;
    }
    .sidebar.is-collapsed { width: 72px; }
    .sidebar.is-hidden { transform: translateX(-100%); }

    .top {
      display: flex;
      gap: 8px;
      align-items: center;
      justify-content: ${/* 버튼을 왼쪽 정렬 */ ''} flex-start;
      margin-bottom: 8px;
    }
    .toggle {
      width: 44px; height: 44px;
      border-radius: 9999px;
      border: 1px solid #dfe7e4;
      background: #f6faf8;
      color: var(--ink-3);
      display: grid; place-items: center;
    }
    .toggle.hide { background: #fff; }

    .nav {
      margin-top: 8px;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    /* 공통 버튼 레이아웃: 항상 같은 틀 (정렬 틀어짐 방지) */
    .itemBtn {
      position: relative;
      display: grid;
      grid-template-columns: 48px 1fr auto;
      align-items: center;
      gap: 10px;
      padding: 2px 6px;
      border-radius: 12px;
      text-decoration: none;
      color: var(--ink-2);
      min-height: 56px;
    }
    .itemBtn.mode-compact {
      grid-template-columns: 48px;
      justify-items: center;
      padding: 2px 0;
      min-height: 52px;
    }

    /* 원형 컨테이너 + 아이콘은 완전 중앙 정렬 */
    .ring {
      width: 44px; height: 44px;
      border-radius: 9999px;
      border: 1px solid #dfe7e4;
      display: grid; place-items: center;  /* ✔️ 아이콘 정확히 중앙 */
      background: #fff;
      transition: background 150ms ease, border-color 150ms ease;
    }
    .itemBtn:hover .ring { background: var(--ring); border-color: var(--mint); }
    .ring-active { background: #e2f4ee; border-color: var(--mint); }

    .ico { display: grid; place-items: center; }
    .svgi { width: 22px; height: 22px; color: var(--ink-3); }
    .active .svgi { color: var(--active); }

    .label {
      font-size: 14px;
      font-weight: 600;
      color: var(--ink-1);
    }
    .preview {
      font-size: 12px;
      color: var(--ink-4);
      justify-self: end;
      padding-right: 8px;
    }

    /* 접힘 + 호버 툴팁 (아이콘 오른쪽에 살짝 띄우기) */
    .tooltip {
      position: absolute;
      left: 68px;
      padding: 6px 10px;
      background: #3a3f3e;
      color: #fff;
      font-size: 12px;
      border-radius: 6px;
      white-space: nowrap;
      opacity: 0;
      transform: translateX(-4px);
      pointer-events: none;
      transition: opacity 120ms ease, transform 120ms ease;
    }
    .itemBtn.mode-compact:hover .tooltip {
      opacity: 1;
      transform: translateX(0);
    }

    @media (max-width: 768px) {
      .sidebar { width: 76vw; max-width: 320px; }
      .sidebar.is-collapsed { width: 64vw; }
      .itemBtn { min-height: 54px; }
      .svgi { width: 22px; height: 22px; }
    }
  `}</style>
);

const fabCSS = (
  <style jsx>{`
    :root { ${INK} }
    .fabOpen {
      position: fixed;
      left: 14px;
      bottom: 18px;
      width: 48px; height: 48px;
      border-radius: 9999px;
      border: 1px solid #dfe7e4;
      background: #f6faf8;
      color: var(--ink-3);
      z-index: 70;
      display: grid; place-items: center;
    }
  `}</style>
);

const globalPad = (
  <style jsx global>{`
    /* 본문은 사이드바 폭만큼 여백 */
    #page { margin-left: var(--sb-w, 240px); transition: margin-left 180ms ease; }
    @media (max-width: 768px) {
      #page { margin-left: 0; } /* 모바일은 오버레이처럼 사용 */
    }
  `}</style>
);