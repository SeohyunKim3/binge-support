// src/app/calendar/page.tsx
'use client'

import Link from 'next/link'

export default function CalendarPage() {
  return (
    <main className="container">
      <div className="card" style={{ padding: 16 }}>
        <h2 className="page-title" style={{ marginBottom: 12 }}>달력</h2>
        <p className="subtle">여기는 /calendar 라우트입니다. 사이드바에서 “달력” 클릭 시 여기로 옵니다.</p>

        {/* 필요 시 대시보드로 돌아가기 */}
        <div style={{ marginTop: 16 }}>
          <Link className="btn-ghost" href="/dashboard">← 대시보드</Link>
        </div>
      </div>
    </main>
  )
}