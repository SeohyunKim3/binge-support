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
  is_resolved: boolean
}

export default function DashboardPage() {
  const router = useRouter()

  const [username, setUsername] = useState('')
  const [content, setContent] = useState('')
  const [publish, setPublish] = useState(false)
  const [entries, setEntries] = useState<Entry[]>([])
  const [loading, setLoading] = useState(true)

  // 이름 설정용 상태
  const [needName, setNeedName] = useState(false)
  const [nameInput, setNameInput] = useState('')
  const [nameSaving, setNameSaving] = useState(false)
  const [nameError, setNameError] = useState<string | null>(null)

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.replace('/'); return }
      await Promise.all([loadProfile(user.id), loadEntries(user.id)])
      setLoading(false)
    })()
  }, [router])

  async function loadProfile(userId: string) {
    const { data } = await supabase
      .from('profiles')
      .select('username')
      .eq('id', userId)
      .maybeSingle()

    const name = data?.username ?? ''
    setUsername(name)
    setNeedName(!name)          // 이름 없으면 이름 설정 카드 띄움
    setNameInput(name || '')    // 입력창 초기값
  }

  async function loadEntries(userId: string) {
    const { data } = await supabase
      .from('entries')
      .select('id, user_id, content, created_at, is_public, is_resolved')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
    setEntries((data ?? []) as Entry[])
  }

  async function toggleResolved(id: string, makeResolved: boolean) {
    const { error } = await supabase
      .from('entries')
      .update({ is_resolved: makeResolved })
      .eq('id', id)
  
    if (!error) {
      setEntries(prev =>
        prev.map(e =>
          e.id === id ? { ...e, is_resolved: makeResolved } : e
        )
      )
    }
  }

  // ---------- 이름 저장 ----------
  async function saveDisplayName() {
    setNameError(null)
    const raw = nameInput.trim()
    // 간단한 유효성: 2~20자
    if (raw.length < 2 || raw.length > 20) {
      setNameError('이름은 2~20자 사이로 입력해 주세요.')
      return
    }

    setNameSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setNameSaving(false); return }

    // 중복 체크
    const { data: taken } = await supabase
      .from('profiles')
      .select('id')
      .eq('username', raw)
      .maybeSingle()

    if (taken && taken.id !== user.id) {
      setNameSaving(false)
      setNameError('이미 사용 중인 이름이에요. 다른 이름을 시도해 주세요.')
      return
    }

    // upsert (id 충돌 시 업데이트)
    const { error } = await supabase
      .from('profiles')
      .upsert({ id: user.id, username: raw }, { onConflict: 'id' })

    setNameSaving(false)
    if (error) {
      setNameError(error.message)
      return
    }

    setUsername(raw)
    setNeedName(false)
  }

  // ---------- entry actions ----------
  async function createEntry() {
    const text = content.trim()
    if (!text) return
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { error } = await supabase.from('entries').insert({
      user_id: user.id,
      content: text,
      is_public: publish,
    })
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
    return new Intl.DateTimeFormat(locale, {
      year: 'numeric', month: 'long', day: 'numeric', weekday: 'short'
    }).format(new Date(Date.UTC(y, m - 1, d)))
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
    // 배경 이미지 + 오버레이는 유지
    <main
      style={{
        minHeight: '100vh',
        position: 'relative',
        backgroundImage: "url('/journal-bg.png')",
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }}
    >
      <div
        aria-hidden
        style={{
          position: 'absolute',
          inset: 0,
          background: 'rgba(255,255,255,0.65)',
        }}
      />

      {/* ===== 이름 설정이 필요하면, 설정 카드만 보여줌 (본문 가림) ===== */}
      {needName ? (
        <div className="container" style={{ position: 'relative', zIndex: 1 }}>
          <div className="card" style={{ maxWidth: 720, margin: '80px auto' }}>
            <h2 className="page-title" style={{ marginBottom: 8 }}>표시 이름 설정</h2>
            <p className="subtle" style={{ marginBottom: 16 }}>
              커뮤니티와 저널에서 보일 이름을 먼저 정해 주세요. (2~20자)
            </p>

            <div className="row" style={{ gap: 12, alignItems: 'center' }}>
              <input
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                placeholder="예: 소율, Sunray, 마음기록가"
                className="input"
                style={{
                  flex: 1,
                  padding: '10px 12px',
                  borderRadius: 10,
                  border: '1px solid var(--border)',
                  background: '#fff',
                  fontSize: 14,
                }}
              />
              <button
                disabled={nameSaving}
                onClick={saveDisplayName}
                style={{
                  padding: '10px 18px',
                  border: 'none',
                  borderRadius: 9999,
                  background: 'linear-gradient(135deg, #6DD5FA, #2980B9)',
                  color: '#fff',
                  fontWeight: 700,
                  cursor: 'pointer',
                  opacity: nameSaving ? 0.7 : 1
                }}
              >
                {nameSaving ? 'Saving...' : 'Save'}
              </button>
            </div>

            {nameError && (
              <p style={{ color: '#d33', marginTop: 10, fontSize: 13 }}>{nameError}</p>
            )}

            <div className="row" style={{ marginTop: 16, justifyContent: 'flex-end', gap: 8 }}>
              <button
                className="btn-ghost"
                onClick={async () => { await supabase.auth.signOut(); router.replace('/') }}
              >
                이만 나가보기
              </button>
            </div>
          </div>
        </div>
      ) : (
        // ===== 이름이 있으면 기존 저널 UI 출력 =====
        <div className="container" style={{ position: 'relative', zIndex: 1 }}>
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

            {/* New entry */}
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
                  fontSize: '14px',
                  lineHeight: 1.4,
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

                <button
                  onClick={createEntry}
                  style={{
                    backgroundColor: '#6ba292',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: 9999,
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
                        <div className="item-head">
                          <span className="item-time">
                            조각 #{idx + 1} • {new Date(it.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          <span className={`badge ${it.is_public ? 'pub' : 'priv'}`}>
                            {it.is_public ? 'Published' : 'Private'}
                          </span>
                          <span
                          className={`badge ${it.is_resolved ? 'resolved' : 'unresolved'}`}
                          style={{
                            marginLeft: 8,
                            background: it.is_resolved ? '#4caf50' : '#f44336',
                            color: '#fff',
                          }}
                        >
                          {it.is_resolved ? '해결됨' : '미해결'}
                        </span>
                        </div>

                        <p className="entry-text" style={{ margin: '8px 0 10px', whiteSpace: 'pre-wrap', gap: '2px' }}>
                          {it.content}
                        </p>

                        <div className="row small-btns">
                          <button className="btn-mini" onClick={() => router.push(`/dashboard/entry/${it.id}`)}>편집</button>
                          <button className="btn-mini2" onClick={() => removeEntry(it.id)}>삭제</button>
                          <button
    className="btn-mini"
    onClick={() => toggleResolved(it.id, !it.is_resolved)}
  >
    {it.is_resolved ? '미해결로' : '해결로'}
  </button>
                        </div>

                        {/* spacing */}
                        <p> </p><p> </p><p> </p><p> </p><p> </p>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </main>
  )
}