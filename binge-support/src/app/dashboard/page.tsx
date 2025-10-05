'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../lib/supabaseClient'
import confetti from 'canvas-confetti'
import Markdown from '@/components/Markdown' // 뷰어만 사용

/* ----------------------------- Types ----------------------------- */
type Entry = {
  id: string
  user_id: string
  content: string
  created_at: string
  is_public: boolean
  is_resolved: boolean
  is_deleted: boolean
  details_md: string | null
}

type EntryPatch = Partial<{
  id: string
  content: string
  is_public: boolean
  is_resolved: boolean
  details_md: string | null
}>

/* ------------ 개별 카드 (읽기 전용. 편집은 별도 페이지) ------------ */
type RowProps = {
  it: Entry
  num: number
  onRemove: (id: string) => void
  onToggleResolved: (id: string, make: boolean) => void
  onTogglePublic: (id: string, make: boolean) => void
  compact?: boolean
}

function EntryRow({
  it,
  num,
  onRemove,
  onToggleResolved,
  onTogglePublic,
  compact = false,
}: RowProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [entry, setEntry] = useState<Entry>(it);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    setEntry(it)
  }, [it])

  // 본문 클릭 → 디테일(있으면) 토글만
  const handleToggleFromContent = () => {
    if (it.details_md && it.details_md.trim().length > 0) setOpen((o) => !o)
  }

  return (
    <li className="item">
      <div className="item-head">
        <span className="item-time">
        조각 #{num} • {new Date(it.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>

        {/* 공개/프라이빗 배지 클릭 → 공개 상태 토글 */}
        <span
          role="button"
          tabIndex={0}
          className={`badge ${it.is_public ? 'pub' : 'priv'}`}
          title="클릭해서 공개/비공개 전환"
          onClick={() => onTogglePublic(it.id, !it.is_public)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') onTogglePublic(it.id, !it.is_public)
          }}
          style={{ cursor: 'pointer' }}
        >
          {it.is_public ? '공유됨' : '🤫프라이빗'}
        </span>
      </div>

      {/* 본문(클릭하면 디테일 토글) */}
      <div
        className="entry-clickable"
        onClick={handleToggleFromContent}
        title="디테일이 있다면 클릭해 펼쳐보기"
        style={{ cursor: it.details_md ? 'pointer' : 'default', userSelect: 'text', margin: '8px 0 10px' }}
      >
        <p className="entry-text" style={{ margin: 0, whiteSpace: 'pre-wrap' }}>
          {it.content}
        </p>
        {!it.details_md && (
          <div style={{ marginTop: 6, fontSize: 12, color: '#89928a' }}>
            디테일은 <b>편집</b> 화면에서 작성할 수 있어요 ✏️
          </div>
        )}
      </div>

      {/* 하단 조작 버튼 */}
      <div className="row small-btns" style={{ gap: 8 }}>
        <button
          className="btn-mini"
          onClick={(e) => {
            e.stopPropagation()
            router.push(`/dashboard/entry/${it.id}`)
          }}
        >
          편집
        </button>

        <button
          className="btn-mini2"
          onClick={(e) => {
            e.stopPropagation()
            onRemove(it.id)
          }}
        >
          삭제
        </button>

        {/* 해결/미해결 라벨 (클릭 토글) */}
        <span
          role="button"
          tabIndex={0}
          title="클릭해서 상태 바꾸기"
          onClick={(e) => {
            e.stopPropagation()
            onToggleResolved(it.id, !it.is_resolved)
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') onToggleResolved(it.id, !it.is_resolved)
          }}
          className={`tag ${it.is_resolved ? 'tag--ok' : 'tag--todo'}`}
          style={{ marginLeft: 6, cursor: 'pointer' }}
        >
          {it.is_resolved ? '완료' : '급해!'}
        </span>
      </div>

      {/* 디테일 뷰어(보기 전용) */}
      {it.details_md && open && (
        <div
          style={{
            marginTop: 12,
            borderLeft: '3px solid #d7ead7',
            padding: '8px 12px',
            background: '#f9fdf9',
            borderRadius: 8,
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <Markdown content={it.details_md} />
        </div>
      )}
    </li>
  )
}

/* ------------------------------ 페이지 ------------------------------ */
export default function DashboardPage() {
  const router = useRouter()

  const [username, setUsername] = useState('')
  const [content, setContent] = useState('')
  const [publish, setPublish] = useState(false)
  const [entries, setEntries] = useState<Entry[]>([])
  const [loading, setLoading] = useState(true)

  const [seeds, setSeeds] = useState<number>(0)
  const [flowers, setFlowers] = useState<number>(0)
  const [canCollect, setCanCollect] = useState<boolean>(false)

  const [needName, setNeedName] = useState(false)
  const [nameInput, setNameInput] = useState('')
  const [nameSaving, setNameSaving] = useState(false)
  const [nameError, setNameError] = useState<string | null>(null)

  const [showUnresolvedOnly, setShowUnresolvedOnly] = useState(false)



  // 대시보드 전역 리스너 (컴포넌트 최상단 useEffect들 옆)
  useEffect(() => {
    function handleUpdated(e: Event) {
      const patch = (e as CustomEvent).detail as EntryPatch
      if (!patch?.id) return
      setEntries(prev =>
        prev.map(it => it.id === patch.id ? { ...it, ...patch } : it)
      )
    }
    window.addEventListener('entry-updated', handleUpdated as EventListener)
    return () => window.removeEventListener('entry-updated', handleUpdated as EventListener)
  }, [])

  /* ------------------ 초기 로드 ------------------ */
  useEffect(() => {
    ;(async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.replace('/'); return }
      await Promise.all([loadProfile(user.id), loadEntries(user.id)])
      setLoading(false)
    })()
  }, [router])

  /* ------------------ Realtime 구독 ------------------ */
  useEffect(() => {
    let channel: ReturnType<typeof supabase.channel> | null = null
    ;(async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      channel = supabase
        .channel('entries-realtime')
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'entries',
          filter: `user_id=eq.${user.id}`,
        }, (payload) => {
          if (payload.eventType === 'INSERT' && payload.new) {
            const row = payload.new as Entry
            setEntries(prev => prev.some(e => e.id === row.id) ? prev : [row, ...prev])
          }
          if (payload.eventType === 'UPDATE' && payload.new) {
            const row = payload.new as Entry
            setEntries(prev => prev.map(e => e.id === row.id ? { ...e, ...row } : e))
          }
          if (payload.eventType === 'DELETE' && payload.old) {
            const oldId = (payload.old as { id: string }).id
            setEntries(prev => prev.filter(e => e.id !== oldId))
          }
        })
        .subscribe()
    })()
    return () => { if (channel) supabase.removeChannel(channel) }
  }, [])

  /* ------------------ helpers ------------------ */
  function todayLocalKey() {
    const d = new Date()
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset())
    return d.toISOString().slice(0, 10)
  }

  async function loadProfile(userId: string) {
    const { data, error } = await supabase
      .from('profiles')
      .select('username, seeds, flowers, last_collected')
      .eq('id', userId)
      .maybeSingle()

    if (error || !data) return

    setUsername(data.username ?? '')
    setNeedName(!data.username)

    let s = data.seeds ?? 0
    let f = data.flowers ?? 0
    if (s >= 7) {
      const add = Math.floor(s / 7)
      s = s % 7
      f = f + add
      await supabase.from('profiles').update({ seeds: s, flowers: f }).eq('id', userId)
    }
    setSeeds(s); setFlowers(f)

    const last: string | null = data.last_collected ?? null
    const today = todayLocalKey()
    setCanCollect(!last || last !== today)
  }

  async function collectSeed() {
    if (!canCollect) return
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    confetti({ particleCount: 80, spread: 70, origin: { y: 0.8 }, colors: ['#a7d7a9', '#7fc8a9', '#e2f1e7', '#8fcbbc'] })

    const today = todayLocalKey()
    const nextSeeds = seeds + 1
    let newSeeds = nextSeeds
    let newFlowers = flowers

    if (nextSeeds >= 7) {
      const add = Math.floor(nextSeeds / 7)
      newFlowers += add
      newSeeds = nextSeeds % 7
      confetti({ particleCount: 120, spread: 90, origin: { y: 0.7 }, colors: ['#ffc1e3', '#ff8fab', '#ffd6e7', '#ffe5f1'] })
    }

    const { error } = await supabase
      .from('profiles')
      .update({ seeds: newSeeds, flowers: newFlowers, last_collected: today })
      .eq('id', user.id)

    if (!error) {
      setSeeds(newSeeds)
      setFlowers(newFlowers)
      setCanCollect(false)
    }
  }

  async function loadEntries(userId: string) {
    const { data } = await supabase
      .from('entries')
      .select('id, user_id, content, created_at, is_public, is_resolved, is_deleted, details_md')
      .eq('user_id', userId)
      .eq('is_deleted', false)
      .order('created_at', { ascending: false })
    setEntries((data ?? []) as Entry[])
  }

  const unresolvedSorted = useMemo(
    () => entries.filter((e) => !e.is_resolved).sort((a, b) => (a.created_at < b.created_at ? 1 : -1)),
    [entries]
  )

  // 오래된 → 최신 순으로 번호 매기기
const ordinalById = useMemo(() => {
  const asc = [...entries].sort((a, b) =>
    a.created_at < b.created_at ? -1 : a.created_at > b.created_at ? 1 : 0
  )
  const map: Record<string, number> = {}
  asc.forEach((e, i) => { map[e.id] = i + 1 })
  return map
}, [entries])

  /* ------------------ actions (낙관적 업데이트) ------------------ */
  async function createEntry() {
    const text = content.trim()
    if (!text) return
  
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
  
    // 1️⃣ DB에 새 entry 삽입
    const { data: inserted, error } = await supabase
      .from('entries')
      .insert({
        user_id: user.id,
        content: text,
        is_public: publish,
        is_deleted: false,
        is_resolved: false,
      })
      .select('id, user_id, content, created_at, is_public, is_resolved, is_deleted, details_md')
      .single()
  
    if (error) {
      alert(error.message)
      return
    }
  
    // 2️⃣ 입력창 초기화
    setContent('')
    setPublish(false)
  
    // 3️⃣ 로컬 상태에 즉시 반영
    setEntries(prev => [inserted as Entry, ...prev])
  
    // 4️⃣ ✅ 다른 페이지(대시보드/에디터 등)도 즉시 반영되도록 전역 이벤트 발행
    window.dispatchEvent(
      new CustomEvent('entry-updated', {
        detail: {
          id: inserted.id,
          content: inserted.content,
          is_public: inserted.is_public,
          is_resolved: inserted.is_resolved,
          details_md: inserted.details_md,
        } as EntryPatch,
      })
    )
  }

  async function removeEntry(id: string) {
    if (!confirm('기록을 지울까요?')) return
    const snapshot = entries
    setEntries(prev => prev.filter(e => e.id !== id))
    const { error } = await supabase.from('entries').update({ is_deleted: true }).eq('id', id)
    if (error) { setEntries(snapshot); alert(error.message) }
  }

  async function toggleResolved(id: string, makeResolved: boolean) {
    const snapshot = entries
    setEntries(prev => prev.map(e => e.id === id ? { ...e, is_resolved: makeResolved } : e))
    const { error } = await supabase.from('entries').update({ is_resolved: makeResolved }).eq('id', id)
    if (error) { setEntries(snapshot); alert(error.message) }
    else if (makeResolved) {
      confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 }, colors: ['#9be2b0', '#7fc8a9', '#4b8a70', '#e8f7ec'] })
    }
  }

  async function togglePublic(id: string, makePublic: boolean) {
    const snapshot = entries
    setEntries(prev => prev.map(e => e.id === id ? { ...e, is_public: makePublic } : e))
    const { error } = await supabase.from('entries').update({ is_public: makePublic }).eq('id', id)
    if (error) { setEntries(snapshot); alert(error.message) }
  }

  /* ------------------ 날짜 그룹화 ------------------ */
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
    Object.values(g).forEach((list) => list.sort((a, b) => (a.created_at < b.created_at ? 1 : -1)))
    const days = Object.keys(g).sort((a, b) => (a < b ? 1 : -1))
    return { grouped: g, sortedDays: days }
  }, [entries])

  if (loading) return null

  /* ------------------------------ UI ------------------------------ */
  return (
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
      <div aria-hidden style={{ position: 'absolute', inset: 0, background: 'rgba(255,255,255,0.65)' }} />

      {/* 이름 설정 카드 */}
      {needName ? (
        <div className="container" style={{ position: 'relative', zIndex: 1 }}>
          <div className="card" style={{ maxWidth: 720, margin: '80px auto' }}>
            <h2 className="page-title" style={{ marginBottom: 8 }}>표시 이름 설정</h2>
            <p className="subtle" style={{ marginBottom: 16 }}>커뮤니티와 저널에서 보일 이름을 먼저 정해 주세요. (2~20자)</p>
            <div className="row" style={{ gap: 12, alignItems: 'center' }}>
              <input
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                placeholder="예: 소율, Sunray, 마음기록가"
                className="input"
                style={{ flex: 1, padding: '10px 12px', borderRadius: 10, border: '1px solid var(--border)', background: '#fff', fontSize: 14 }}
              />
              <button
                disabled={nameSaving}
                onClick={async () => {
                  setNameError(null)
                  const raw = nameInput.trim()
                  if (raw.length < 2 || raw.length > 20) { setNameError('이름은 2~20자 사이로 입력해 주세요.'); return }
                  setNameSaving(true)
                  const { data: { user } } = await supabase.auth.getUser()
                  if (!user) { setNameSaving(false); return }
                  const { data: taken } = await supabase.from('profiles').select('id').eq('username', raw).maybeSingle()
                  if (taken && taken.id !== user.id) { setNameSaving(false); setNameError('이미 사용 중인 이름이에요.'); return }
                  const { error } = await supabase.from('profiles').upsert({ id: user.id, username: raw }, { onConflict: 'id' })
                  setNameSaving(false)
                  if (error) { setNameError(error.message); return }
                  setUsername(raw); setNeedName(false)
                }}
                style={{ padding: '10px 18px', border: 'none', borderRadius: 9999, background: 'linear-gradient(135deg, #6DD5FA, #2980B9)', color: '#fff', fontWeight: 700, cursor: 'pointer', opacity: nameSaving ? 0.7 : 1 }}
              >
                {nameSaving ? '저장중...' : '저장'}
              </button>
            </div>
            {nameError && <p style={{ color: '#d33', marginTop: 10, fontSize: 13 }}>{nameError}</p>}
          </div>
        </div>
      ) : (
        <div className="container" style={{ position: 'relative', zIndex: 1 }}>
          <div className="card">
            <header className="page-head">
              <h2 className="page-title">나의 기록장</h2>
              <div className="row">
                <button className="btn-ghost" onClick={() => router.push('/social')}>🪄 조각 모음</button>
                <button
                  className="btn-ghost"
                  onClick={() => setShowUnresolvedOnly((v) => !v)}
                  style={{ color: showUnresolvedOnly ? '#2e7d32' : undefined, fontWeight: showUnresolvedOnly ? 700 : 500 }}
                  title="미해결만 보기 토글"
                >
                  {showUnresolvedOnly ? '전체 보기' : '빨리해 급해!'}
                </button>
              </div>
            </header>

            {username && <p className="subtle">나는 <strong>{username}</strong></p>}

            {/* 새 글 */}
            <div style={{ marginTop: 8 }}>
              <textarea
                rows={6}
                placeholder="오늘도 화이팅. 당신의 속마음을 풀어보세요..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: '1px solid var(--border)', background: '#fff', fontSize: 14, lineHeight: 1.4, resize: 'vertical', fontFamily: 'inherit' }}
              />
              <div className="row" style={{ marginTop: 10, alignItems: 'center' }}>
                <label className="subtle" style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                  <input type="checkbox" checked={publish} onChange={(e) => setPublish(e.target.checked)} />
                  조각 페이지에 올려보기
                </label>
                <div style={{ flex: 1 }} />
                <button
                  onClick={createEntry}
                  style={{ backgroundColor: '#6ba292', color: '#ffffff', border: 'none', borderRadius: 9999, padding: '10px 20px', fontSize: 14, fontWeight: 700, cursor: 'pointer', transition: 'transform .05s ease, filter .15s ease, box-shadow .15s ease' }}
                  onMouseOver={(e) => { e.currentTarget.style.filter = 'brightness(0.98)'; e.currentTarget.style.boxShadow = '0 14px 30px rgba(17,24,39,0.10)' }}
                  onMouseOut={(e) => { e.currentTarget.style.filter = 'none'; e.currentTarget.style.boxShadow = '0 10px 24px rgba(17,24,39,0.08)' }}
                  onMouseDown={(e) => (e.currentTarget.style.transform = 'translateY(1px)')}
                  onMouseUp={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
                >
                  저장
                </button>
              </div>
            </div>

            {/* 목록 */}
            <div style={{ marginTop: 24 }}>
              {showUnresolvedOnly ? (
                <>
                  {unresolvedSorted.length === 0 && <p className="subtle">미해결 조각이 없어요. 모두 해결되었네요! 🎉</p>}
                  <ul className="list">
                    {unresolvedSorted.map((it) => (
                      <EntryRow
                        key={it.id}
                        it={it}
                        num={ordinalById[it.id]}
                        compact
                        onRemove={removeEntry}
                        onToggleResolved={toggleResolved}
                        onTogglePublic={togglePublic}
                      />
                    ))}
                  </ul>
                </>
              ) : (
                <>
                  {sortedDays.length === 0 && <p className="subtle">아직 조각이 없어요ㅠㅠ 지금 작성해보세요!</p>}
                  {sortedDays.map((dayKey) => (
                    <div key={dayKey}>
<div id={`d-${dayKey}`} className="date-head">
  {formatDateHeader(dayKey)}
</div>                      <ul className="list">
                        {grouped[dayKey].map((it) => (
                          <EntryRow
                            key={it.id}
                            it={it}
                            num={ordinalById[it.id]}
                            onRemove={removeEntry}
                            onToggleResolved={toggleResolved}
                            onTogglePublic={togglePublic}
                          />
                        ))}
                      </ul>
                    </div>
                  ))}
                </>
              )}
            </div>

            {/* 하단 버튼 */}
            <div style={{ marginTop: 40, textAlign: 'center' }}>
              <button
                className="btn-ghost"
                onClick={() => router.push('/trash')}
                style={{ marginTop: 24, color: '#6b6b6b', fontSize: 14, border: '1px solid #ccc', padding: '8px 16px', borderRadius: 9999 }}
              >
                휴지통 보기
              </button>
              <button
                className="btn-ghost"
                onClick={async () => { await supabase.auth.signOut(); router.replace('/') }}
                style={{ marginTop: 24, color: '#6b6b6b', fontSize: 14, border: '1px solid #ccc', padding: '8px 16px', borderRadius: 9999 }}
              >
                이만 나가보기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 씨앗 수집 UI */}
      <div style={{ marginTop: 40, textAlign: 'center', paddingBottom: 80 }}>
        {canCollect ? (
          <button
            onClick={collectSeed}
            style={{ background: 'none', border: 'none', cursor: 'pointer', animation: 'float 2s ease-in-out infinite' }}
            title="오늘의 씨앗 수집하기"
          >
            <span style={{ fontSize: 36 }}>🌱</span>
            <p style={{ fontSize: 12, color: '#6b6b6b' }}>오늘의 씨앗 수집</p>
          </button>
        ) : (
          <div style={{ color: '#9b9b9b', fontSize: 13, marginBottom: 10 }}>오늘의 씨앗은 이미 모았어요 🌿</div>
        )}

        <div style={{ marginTop: 20, display: 'flex', justifyContent: 'center', gap: 6, flexWrap: 'wrap' }} aria-label="나의 씨앗/꽃 저장소" title="씨앗 7개를 모으면 꽃 1개가 됩니다">
          {Array.from({ length: flowers }).map((_, i) => (<span key={`f-${i}`} style={{ fontSize: 22 }}>🌸</span>))}
          {Array.from({ length: seeds }).map((_, i) => (<span key={`s-${i}`} style={{ fontSize: 22 }}>🌱</span>))}
        </div>
        <p style={{ fontSize: 12, color: '#8a8a8a', marginTop: 6 }}>씨앗 7개를 모으면 🌸 꽃으로 바뀝니다.</p>
      </div>
    </main>
  )
}