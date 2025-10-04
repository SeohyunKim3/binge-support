'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../lib/supabaseClient'
import confetti from 'canvas-confetti'
import Markdown from '@/components/Markdown'
import DetailsEditor from '@/components/DetailsEditor'

type Entry = {
  id: string
  user_id: string
  content: string
  created_at: string
  is_public: boolean
  is_resolved: boolean
  is_deleted: boolean
  details_md?: string | null
}

type RowProps = {
  it: Entry;
  idx: number;
  onRemove: (id: string) => void;
  onToggleResolved: (id: string, make: boolean) => void;
  onSaveDetails: (id: string, md: string) => void;
  compact?: boolean;
};

/* ------------------------ 개별 카드 컴포넌트 ------------------------ */
function EntryRow({ it, idx, onRemove, onToggleResolved, onSaveDetails, compact = false }: RowProps) {
  const router = useRouter();

  // 기존
  // 로컬 상태(보기/편집/현재 엔트리)
  const [entry, setEntry] = useState<Entry>(it);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(false);

  // 부모에서 it이 갱신되면 로컬 상태도 동기화
  useEffect(() => {
    setEntry(it);
  }, [it.id, it.is_resolved, it.is_public, it.content, it.details_md]);

  // 디테일 저장
  const saveDetails = (md: string) => {
    onSaveDetails(entry.id, md);
    setEditing(false);
    setOpen(true);
  };

  // 본문 클릭 시: 디테일이 있으면 토글, 없으면 에디터 열기
  const handleToggleFromContent = () => {
    if (editing) return;
    if (entry.details_md && entry.details_md.trim().length > 0) {
      setOpen((o) => !o);
    } else {
      setEditing(true);
    }
  };

  return (
    <li className="item">
      <div className="item-head">
        <span className="item-time">
          조각 #{idx + 1} •{' '}
          {new Date(entry.created_at).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </span>
        <span className={`badge ${entry.is_public ? 'pub' : 'priv'}`}>
          {entry.is_public ? '공유됨' : '🤫프라이빗'}
        </span>
      </div>

      {/* 본문 영역(클릭 가능) */}
      <div
        className="entry-clickable"
        onClick={handleToggleFromContent}
        title="클릭하여 디테일을 열거나 추가해보세요"
        style={{ cursor: 'pointer', userSelect: 'text', margin: '8px 0 10px' }}
      >
        <p className="entry-text" style={{ margin: 0, whiteSpace: 'pre-wrap' }}>
          {entry.content}
        </p>
        {!editing && (!entry.details_md || entry.details_md.trim().length === 0) && (
          <div style={{ marginTop: 6, fontSize: 12, color: '#89928a' }}>
            더 자세히 적고 싶다면 이 글 영역을 눌러보세요 ✏️
          </div>
        )}
      </div>

      {/* 하단 조작 버튼들 */}
      <div className="row small-btns" style={{ gap: 8 }}>
        <button
          className="btn-mini"
          onClick={(e) => {
            e.stopPropagation();
            router.push(`/dashboard/entry/${entry.id}`);
          }}
        >
          편집
        </button>
        <button
          className="btn-mini2"
          onClick={(e) => {
            e.stopPropagation();
            onRemove(entry.id);
          }}
        >
          삭제
        </button>
        {/* 해결/미해결 라벨 (삭제 옆 하나만) */}
        <span
          role="button"
          tabIndex={0}
          title="클릭해서 상태 바꾸기"
          onClick={(e) => {
            e.stopPropagation();
            onToggleResolved(entry.id, !entry.is_resolved);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') onToggleResolved(entry.id, !entry.is_resolved);
          }}
          className={`tag ${entry.is_resolved ? 'tag--ok' : 'tag--todo'}`}
          style={{ marginLeft: 6, cursor: 'pointer' }}
        >
          {entry.is_resolved ? '완료' : '급해!'}
        </span>
      </div>

      {/* 디테일 편집기 (원하면 이 부분을 실제 DetailsEditor로 교체) */}
      {editing && (
        <div style={{ marginTop: 10 }}>
          {/* DetailsEditor 컴포넌트를 쓰는 경우 */}
          {/* <DetailsEditor
            initial={entry.details_md ?? ''}
            onSave={(text) => saveDetails(text)}
            onCancel={() => setEditing(false)}
          /> */}

          {/* 임시 텍스트에어리어 예시 (DetailsEditor 없을 때) */}
          <textarea
            defaultValue={entry.details_md ?? ''}
            rows={6}
            style={{ width: '100%', border: '1px solid var(--border)', borderRadius: 8, padding: 8 }}
            onBlur={(e) => saveDetails(e.currentTarget.value)}
          />
          <div style={{ marginTop: 6, fontSize: 12, color: '#888' }}>
            포커스를 벗어나면 자동 저장합니다
          </div>
        </div>
      )}

      {/* 디테일 뷰어 */}
      {!editing && entry.details_md && open && (
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
          {/* Markdown 컴포넌트가 있으면 사용하세요 */}
          {/* <Markdown content={entry.details_md} /> */}
          <div style={{ whiteSpace: 'pre-wrap', fontSize: 14 }}>{entry.details_md}</div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 8 }}>
            <button
              className="btn-mini"
              onClick={(e) => {
                e.stopPropagation();
                setEditing(true);
              }}
            >
              디테일 수정
            </button>
          </div>
        </div>
      )}
    </li>
  );
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

  useEffect(() => {
    ;(async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.replace('/'); return }
      await Promise.all([loadProfile(user.id), loadEntries(user.id)])
      setLoading(false)
    })()
  }, [router])

  // 로컬 타임존 YYYY-MM-DD
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
    setNeedName(!data.username)   // ✅ 이름 없으면 이름 설정 모드

    let s = data.seeds ?? 0
    let f = data.flowers ?? 0
    if (s >= 7) {
      const add = Math.floor(s / 7)
      s = s % 7
      f = f + add
      await supabase.from('profiles').update({ seeds: s, flowers: f }).eq('id', userId)
    }
    setSeeds(s)
    setFlowers(f)

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

  async function updateDetails(entryId: string, md: string) {
    const { error } = await supabase.from('entries').update({ details_md: md }).eq('id', entryId)
    if (error) { alert(error.message); return }
    setEntries((prev) => prev.map((e) => (e.id === entryId ? { ...e, details_md: md } : e)))
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
    if (!confirm('기록을 지울까요?')) return
    const { error } = await supabase.from('entries').update({ is_deleted: true }).eq('id', id)
    if (!error) setEntries((prev) => prev.filter((e) => e.id !== id))
  }

  async function toggleResolved(id: string, makeResolved: boolean) {
    const { error } = await supabase.from('entries').update({ is_resolved: makeResolved }).eq('id', id)
    if (!error) {
      setEntries((prev) => prev.map((e) => (e.id === id ? { ...e, is_resolved: makeResolved } : e)))
      if (makeResolved) {
        confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 }, colors: ['#9be2b0', '#7fc8a9', '#4b8a70', '#e8f7ec'] })
      }
    }
  }

  // 이름 저장
  async function saveDisplayName() {
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

    setUsername(raw)
    setNeedName(false)
  }

  // 날짜 그룹화
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
                onClick={saveDisplayName}
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
                    {unresolvedSorted.map((it, idx) => (
                      <EntryRow
                        key={it.id}
                        it={it}
                        idx={idx}
                        compact
                        onRemove={removeEntry}
                        onToggleResolved={toggleResolved}
                        onSaveDetails={updateDetails}
                      />
                    ))}
                  </ul>
                </>
              ) : (
                <>
                  {sortedDays.length === 0 && <p className="subtle">아직 조각이 없어요ㅠㅠ 지금 작성해보세요!</p>}
                  {sortedDays.map((dayKey) => (
                    <div key={dayKey}>
                      <div className="date-head">{formatDateHeader(dayKey)}</div>
                      <ul className="list">
                        {grouped[dayKey].map((it, idx) => (
                          <EntryRow
                            key={it.id}
                            it={it}
                            idx={idx}
                            onRemove={removeEntry}
                            onToggleResolved={toggleResolved}
                            onSaveDetails={updateDetails}
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