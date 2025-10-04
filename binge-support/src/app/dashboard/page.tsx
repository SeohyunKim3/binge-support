'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../lib/supabaseClient'

type Entry = {
  id: string
  user_id: string
  content: string
  created_at: string
  is_public: boolean
}

export default function DashboardPage() {
  const router = useRouter()
  const [username, setUsername] = useState('')
  const [content, setContent] = useState('')
  const [publish, setPublish] = useState(false)
  const [entries, setEntries] = useState<Entry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.replace('/'); return }
      await Promise.all([loadProfile(user.id), loadEntries(user.id)])
      setLoading(false)
    })()
  }, [router])

  async function loadProfile(userId: string) {
    const { data } = await supabase.from('profiles').select('username').eq('id', userId).maybeSingle()
    setUsername(data?.username ?? '')
  }

  async function loadEntries(userId: string) {
    const { data } = await supabase
      .from('entries')
      .select('id, user_id, content, created_at, is_public')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
    setEntries((data ?? []) as Entry[])
  }

  async function createEntry() {
    const text = content.trim()
    if (!text) return
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { error } = await supabase.from('entries').insert({ user_id: user.id, content: text, is_public: publish })
    if (error) return alert(error.message)
    setContent('')
    setPublish(false)
    await loadEntries(user.id)
  }

  async function removeEntry(id: string) {
    if (!confirm('Delete this entry?')) return
    const { error } = await supabase.from('entries').delete().eq('id', id)
    if (!error) setEntries(prev => prev.filter(e => e.id !== id))
  }

  async function togglePublic(id: string, makePublic: boolean) {
    const { error } = await supabase.from('entries').update({ is_public: makePublic }).eq('id', id)
    if (!error) setEntries(prev => prev.map(e => e.id === id ? { ...e, is_public: makePublic } : e))
  }

  // ---------- date grouping helpers ----------
  function toDateKey(iso: string, tz = Intl.DateTimeFormat().resolvedOptions().timeZone) {
    const d = new Date(iso)
    const y = new Intl.DateTimeFormat('en-CA', { year: 'numeric', timeZone: tz }).format(d)
    const m = new Intl.DateTimeFormat('en-CA', { month: '2-digit', timeZone: tz }).format(d)
    const day = new Intl.DateTimeFormat('en-CA', { day: '2-digit', timeZone: tz }).format(d)
    return `${y}-${m}-${day}`
  }

  function formatDateHeader(key: string, locale = 'ko-KR') {
    const [y, m, d] = key.split('-').map(Number)
    return new Intl.DateTimeFormat(locale, { year: 'numeric', month: 'long', day: 'numeric', weekday: 'short' })
      .format(new Date(Date.UTC(y, m - 1, d)))
  }

  const { grouped, sortedDays } = useMemo(() => {
    const g: Record<string, Entry[]> = entries.reduce((acc, it) => {
      const k = toDateKey(it.created_at); (acc[k] ??= []).push(it); return acc
    }, {} as Record<string, Entry[]>)
    Object.values(g).forEach(list => list.sort((a,b) => (a.created_at < b.created_at ? 1 : -1)))
    const days = Object.keys(g).sort((a,b) => (a < b ? 1 : -1))
    return { grouped: g, sortedDays: days }
  }, [entries])

  if (loading) return null

  return (
    <main>
      <div className="container">
        <div className="card">
          {/* Header */}
          <header className="page-head">
            <h2 className="page-title">나의 기록장</h2>
            <div className="row">
              <button className="btn-ghost" onClick={() => router.push('/social')}>우리들의 조각들</button>
              <button
                className="btn-ghost"
                onClick={async () => { await supabase.auth.signOut(); router.replace('/') }}
              >
                이만 나가보기
              </button>
            </div>
          </header>

          {username && (
            <p className="subtle">나는 <strong>{username}</strong></p>
          )}

          {/* New entry area (smaller font + tighter line-height + prettier button) */}
          <div style={{ marginTop: 8 }}>
            <textarea
              rows={6}
              placeholder="오늘도 화이팅. 당신의 속마음을 풀어보세요..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: '10px',
                border: '1px solid var(--border)',
                background: '#fff',
                fontSize: '14px',      // smaller font
                lineHeight: 1.4,        // tighter spacing
                resize: 'vertical',
                fontFamily: 'inherit',
              }}
            />

            <div className="row" style={{ marginTop: 10, alignItems: 'center' }}>
              <label className="subtle" style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                <input
                  type="checkbox"
                  checked={publish}
                  onChange={(e) => setPublish(e.target.checked)}
                />
                우리들의 조각 페이지에 올려보기
              </label>

              <div style={{ flex: 1 }} />

              {/* Prettier Save button */}
              <button
                onClick={createEntry}
                style={{
                  backgroundColor: '#6ba292',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: 9999,           // pill
                  padding: '10px 20px',
                  fontSize: '14px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  boxShadow: 'none',
                  transition: 'transform .05s ease, filter .15s ease, box-shadow .15s ease',
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.filter = 'brightness(0.98)'
                  e.currentTarget.style.boxShadow = '0 14px 30px rgba(17,24,39,0.10)'
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.filter = 'none'
                  e.currentTarget.style.boxShadow = '0 10px 24px rgba(17,24,39,0.08)'
                }}
                onMouseDown={(e) => (e.currentTarget.style.transform = 'translateY(1px)')}
                onMouseUp={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
              >
                Save
              </button>
            </div>
          </div>

          {/* Grouped entries by date */}
          <div style={{ marginTop: 24 }}>
            {sortedDays.length === 0 && <p className="subtle">아직 조각이 없어요ㅠㅠ 지금 작성해보세요!</p>}
            {sortedDays.map((dayKey) => (
              <div key={dayKey}>
                <div className="date-head">{formatDateHeader(dayKey)}</div>
                <ul className="list">
                  {grouped[dayKey].map((it, idx) => (
                    <li key={it.id} className="item">
                     <p>  </p>
                      <div className="item-head">
                        <span className="item-time">
                          조각 #{idx + 1} • {new Date(it.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        <span className={`badge ${it.is_public ? 'pub' : 'priv'}`}>
                          {it.is_public ? 'Published' : 'Private'}
                        </span>
                      </div>

                      <p style={{ margin: '8px 0 10px', whiteSpace: 'pre-wrap' }}>{it.content}</p>

                      {/* compact buttons */}
                      <div className="row small-btns">
                        <button className="btn-mini" onClick={() => router.push(`/dashboard/entry/${it.id}`)}>편집</button>
                        <button className="btn-mini" onClick={() => removeEntry(it.id)}>삭제</button>
                        <button
                          className="btn-mini"
                          onClick={() => togglePublic(it.id, !(it.is_public ?? false))}
                        >
                          {it.is_public ? 'Unpublish' : 'Publish'}
                        </button>
                      </div>
                      <p>  </p>
                      <p>  </p>
                      <p>  </p>
                      <p>  </p>
                      <p>  </p>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  )
}