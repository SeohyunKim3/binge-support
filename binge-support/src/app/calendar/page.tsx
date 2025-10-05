// src/app/calendar/page.tsx
'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { supabase } from '../../lib/supabaseClient'

type EntryLite = {
  id: string
  created_at: string
  content: string
  is_deleted: boolean
  is_resolved: boolean
}

// ---- 유틸: 로컬타임 YYYY-MM-DD 키 ----
function toLocalDateKey(iso: string) {
  const d = new Date(iso)
  // ISO는 UTC 기준이라 로컬 보정
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset())
  return d.toISOString().slice(0, 10)
}

// 해당 month(YYYY, M) 범위의 ISO 시작/끝
function monthRange(date: Date) {
  const y = date.getFullYear()
  const m = date.getMonth() // 0-11
  const start = new Date(y, m, 1)
  const end = new Date(y, m + 1, 1) // 다음달 1일
  return { start, end }
}

// 달력(일요일 시작) 6주 매트릭스
function buildCalendarMatrix(anchor: Date) {
  const first = new Date(anchor.getFullYear(), anchor.getMonth(), 1)
  const startDay = first.getDay() // 0(일)~6(토)
  const start = new Date(first)
  start.setDate(first.getDate() - startDay)

  const weeks: Date[][] = []
  for (let w = 0; w < 6; w++) {
    const row: Date[] = []
    for (let d = 0; d < 7; d++) {
      const cur = new Date(start)
      cur.setDate(start.getDate() + (w * 7 + d))
      row.push(cur)
    }
    weeks.push(row)
  }
  return weeks
}

// 점(●) 농도 계산(0~1)
function intensity(count: number, max: number) {
  if (max <= 0) return 0
  const t = Math.min(count / max, 1)
  // 부드럽게(감마)
  return Math.pow(t, 0.7)
}

export default function CalendarPage() {
  const [loading, setLoading] = useState(true)
  const [month, setMonth] = useState(() => {
    const d = new Date()
    d.setDate(1)
    return d
  })
  const [entries, setEntries] = useState<EntryLite[]>([])
  const [selectedKey, setSelectedKey] = useState<string>(() => toLocalDateKey(new Date().toISOString()))

  // 월 변경 시 데이터 로드
  useEffect(() => {
    (async () => {
      setLoading(true)
      const { start, end } = monthRange(month)

      // ISO 범위 문자열(UTC 기준으로 맞춰 보정)
      const fromISO = new Date(start) // 00:00
      const toISO = new Date(end) // 다음달 1일 00:00

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setEntries([]); setLoading(false); return }

      const { data, error } = await supabase
        .from('entries')
        .select('id, created_at, content, is_deleted, is_resolved')
        .eq('user_id', user.id)
        .eq('is_deleted', false)
        .gte('created_at', fromISO.toISOString())
        .lt('created_at', toISO.toISOString())
        .order('created_at', { ascending: true })

      if (error) {
        console.error(error)
        setEntries([])
      } else {
        setEntries((data ?? []) as EntryLite[])
      }
      setLoading(false)
    })()
  }, [month])

  // 날짜별 그룹/통계
  const byDay = useMemo(() => {
    const g: Record<string, EntryLite[]> = {}
    for (const e of entries) {
      const k = toLocalDateKey(e.created_at)
      ;(g[k] ??= []).push(e)
    }
    return g
  }, [entries])

  const maxCount = useMemo(() => {
    let m = 0
    for (const k of Object.keys(byDay)) m = Math.max(m, byDay[k].length)
    return m
  }, [byDay])

  const thisMonthTotal = entries.length

  // 최고 기록일
  const bestDay = useMemo(() => {
    let bd = ''
    let bc = -1
    for (const k of Object.keys(byDay)) {
      const c = byDay[k].length
      if (c > bc) { bc = c; bd = k }
    }
    return { day: bd, count: bc < 0 ? 0 : bc }
  }, [byDay])

  // 연속 기록(오늘 기준 역방향)
  const streak = useMemo(() => {
    let cnt = 0
    const today = new Date()
    today.setHours(0,0,0,0)
    while (true) {
      const key = toLocalDateKey(today.toISOString())
      if (byDay[key]?.length > 0) {
        cnt++
        today.setDate(today.getDate() - 1)
      } else break
    }
    return cnt
  }, [byDay])

  const weeks = useMemo(() => buildCalendarMatrix(month), [month])

  // 선택한 날짜의 목록
  const selectedList = byDay[selectedKey] ?? []

  // 헤더 표기
  const monthTitle = new Intl.DateTimeFormat('ko-KR', { year: 'numeric', month: 'long' }).format(month)

  function goPrev() {
    const d = new Date(month)
    d.setMonth(month.getMonth() - 1)
    setMonth(d)
  }
  function goNext() {
    const d = new Date(month)
    d.setMonth(month.getMonth() + 1)
    setMonth(d)
  }
  function goToday() {
    const d = new Date()
    d.setDate(1)
    setMonth(d)
    setSelectedKey(toLocalDateKey(new Date().toISOString()))
  }

  

  return (
    <main className="container">
                {/* 아래 보조 라인 */}
                <div className="row" style={{ margin: 18, justifyContent: 'space-between' }}>
          <Link className="btn-ghost3" href="/dashboard">← 대시보드</Link>
        </div>
      <div className="card" style={{ padding: 18 }}>
        {/* 헤더 */}
        <header className="page-head" style={{ marginBottom: 8 }}>
          <h2 className="page-title">{monthTitle}</h2>
          <div className="row" style={{ gap: 8 }}>
            <button className="btn-ghost" onClick={goPrev}>〈</button>
            <button className="btn-ghost" onClick={goToday}>오늘</button>
            <button className="btn-ghost" onClick={goNext}>〉</button>
          </div>
        </header>


        {/* 상단 통계 */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, minmax(0,1fr))',
            gap: 12,
            marginBottom: 16,
          }}
        >
          <StatCard label="이번 달 총 기록" value={`${thisMonthTotal}개`} />
          <StatCard
            label="최고 기록일"
            value={bestDay.count > 0 ? `${bestDay.count}개 • ${fmtKoreanDate(bestDay.day)}` : '—'}
          />
          <StatCard label="연속 기록" value={`${streak}일`} />
        </div>

        

        {/* 달력 + 사이드(선택일 상세) */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '2.2fr 1fr',
            gap: 16,
          }}
        >
          {/* 큰 달력 */}
          <div style={{ border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden', background: '#fff' }}>
            {/* 요일 헤더 */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(7, 1fr)',
                background: '#f6faf7',
                borderBottom: '1px solid var(--border)',
                fontSize: 13,
                color: '#6a7f74',
              }}
            >
              {['일','월','화','수','목','금','토'].map((d) => (
                <div key={d} style={{ padding: '10px 0', textAlign: 'center' }}>{d}</div>
              ))}
            </div>

            {/* 날짜 그리드 */}
            {loading ? (
              <div style={{ padding: 24, textAlign: 'center', color: '#6a7f74' }}>불러오는 중…</div>
            ) : (
              <div style={{ display: 'grid', gridTemplateRows: 'repeat(6, 1fr)' }}>
                {weeks.map((row, ri) => (
                  <div
                    key={`w-${ri}`}
                    style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', minHeight: 78, borderBottom: ri < 5 ? '1px solid var(--border)' : 'none' }}
                  >
                    {row.map((d, di) => {
                      const key = toLocalDateKey(d.toISOString())
                      const inMonth = d.getMonth() === month.getMonth()
                      const cnt = byDay[key]?.length ?? 0
                      const val = intensity(cnt, maxCount)
                      const isToday = key === toLocalDateKey(new Date().toISOString())
                      const isSelected = key === selectedKey

                      return (
                        <button
                          key={`c-${ri}-${di}`}
                          onClick={() => setSelectedKey(key)}
                          title={`${fmtKoreanDate(key)} • ${cnt}개`}
                          style={{
                            display: 'flex',
                            flexDirection: 'column',
                            textAlign: 'center',
                            padding: 20,
                            gap: 10,
                            borderRight: di < 6 ? '0px solid var(--border)' : 'none',
                            background: isSelected ? 'rgba(132, 181, 156, 0.08)' : '#fff',
                            position: 'relative',
                            cursor: 'pointer',
                          }}
                        >
                          {/* 날짜 숫자 */}
                          <div style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: 6,
                            color: inMonth ? '#213a2c' : '#b9c6bf',
                            fontWeight: isToday ? 700 : 600,
                          }}>
                            <span
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                width: 24, height: 24,
                                borderRadius: '9999px',
                                background: isToday ? '#e7f5ee' : 'transparent',
                                border: isToday ? '1px solid #a7c8b9' : 'none',
                              }}>
                              {d.getDate()}
                            </span>

                            {/* 점 + 숫자 */}
                            {cnt > 0 && (
                              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                                <span
                                  style={{
                                    width: 10, height: 10, borderRadius: 10,
                                    background: `rgba(92, 154, 128, ${0.18 + 0.55 * val})`,
                                    boxShadow: `0 0 0 1px rgba(92,154,128, ${0.18 + 0.55 * val}) inset`,
                                  }}
                                />
                                <span style={{ fontSize: 12, color: '#4d6e5c' }}>{cnt}</span>
                              </span>
                            )}
                          </div>
                        </button>
                      )
                    })}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 선택 날짜 상세 */}
          <aside style={{ border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden', background: '#fff' }}>
            <div style={{ padding: 12, borderBottom: '1px solid var(--border)', background: '#f9fdf9' }}>
              <div style={{ fontWeight: 700, color: '#2b4b3a' }}>{fmtKoreanDate(selectedKey)}</div>
              <div className="subtle" style={{ marginTop: 2 }}>기록 {selectedList.length}개</div>
            </div>
            <div style={{ padding: 12 }}>
              {selectedList.length === 0 ? (
                <div className="subtle" style={{ padding: '18px 6px' }}>아직 기록이 없어요. 오늘 한 줄만 남겨볼까요? 🌱</div>
              ) : (
                <ul style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {selectedList
                    .slice()
                    .sort((a, b) => (a.created_at < b.created_at ? 1 : -1))
                    .map((e) => (
                      <li key={e.id} style={{
                        border: '1px solid var(--border)',
                        borderRadius: 10,
                        padding: 10,
                        background: '#fff',
                      }}>
                        <div style={{ fontSize: 12, color: '#6a7f74', marginBottom: 6 }}>
                          {new Date(e.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                        <div style={{ whiteSpace: 'pre-wrap', fontSize: 14, lineHeight: 1.5 }}>
                          {e.content.length > 200 ? e.content.slice(0, 200) + '…' : e.content}
                        </div>
                      </li>
                    ))}
                </ul>
              )}
            </div>
          </aside>
        </div>


      </div>
    </main>
  )
}

/* -------------------- 작은 통계 카드 -------------------- */
function StatCard({ label, value }: { label: string, value: string }) {
  return (
    <div
      style={{
        border: '1px solid var(--border)',
        borderRadius: 12,
        padding: 12,
        background: '#fff',
      }}
    >
      <div style={{ fontSize: 12, color: '#6a7f74', marginBottom: 4 }}>{label}</div>
      <div style={{ fontWeight: 800, fontSize: 16, color: '#2b4b3a' }}>{value}</div>
    </div>
  )
}

/* -------------------- 날짜 표시 helper -------------------- */
function fmtKoreanDate(key: string) {
  if (!key) return ''
  const [y, m, d] = key.split('-').map(Number)
  const date = new Date(y, m - 1, d)
  return new Intl.DateTimeFormat('ko-KR', {
    month: 'long',
    day: 'numeric',
    weekday: 'short'
  }).format(date)
}