'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../lib/supabaseClient' // <-- adjust if your path differs

type Entry = {
  id: string
  user_id: string
  content: string
  created_at: string
  is_public: boolean
}

export default function DashboardPage() {
  const router = useRouter()

  // profile / compose state
  const [username, setUsername] = useState('')
  const [content, setContent] = useState('')
  const [publish, setPublish] = useState(false)

  // list state
  const [entries, setEntries] = useState<Entry[]>([])
  const [loading, setLoading] = useState(true)
  const [savingName, setSavingName] = useState(false)

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.replace('/'); return }
      await Promise.all([loadProfile(user.id), loadEntries(user.id)])
      setLoading(false)
    })()
  }, [router])

  // ---- helpers for date grouping ----
  function toDateKey(iso: string, timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone) {
    const d = new Date(iso)
    const y = new Intl.DateTimeFormat('en-CA', { year: 'numeric', timeZone }).format(d)
    const m = new Intl.DateTimeFormat('en-CA', { month: '2-digit', timeZone }).format(d)
    const day = new Intl.DateTimeFormat('en-CA', { day: '2-digit', timeZone }).format(d)
    return `${y}-${m}-${day}` // e.g. "2025-10-04"
  }
  function formatDateHeader(key: string, locale = 'ko-KR') {
    const [y, m, d] = key.split('-').map(Number)
    return new Intl.DateTimeFormat(locale, {
      year: 'numeric', month: 'long', day: 'numeric', weekday: 'short'
    }).format(new Date(Date.UTC(y, m - 1, d)))
  }

  // compute grouped structure
  const { grouped, sortedDays } = useMemo(() => {
    const g: Record<string, Entry[]> = entries.reduce((acc, it) => {
      const k = toDateKey(it.created_at)
      ;(acc[k] ??= []).push(it)
      return acc
    }, {} as Record<string, Entry[]>)
    Object.values(g).forEach(list => list.sort((a, b) => (a.created_at < b.created_at ? 1 : -1)))
    const days = Object.keys(g).sort((a, b) => (a < b ? 1 : -1)) // newest → oldest
    return { grouped: g, sortedDays: days }
  }, [entries])

  // ---- data loaders & mutations ----
  async function loadProfile(userId: string) {
    const { data } = await supabase
      .from('profiles')
      .select('username')
      .eq('id', userId)
      .maybeSingle()
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

  async function saveDisplayName() {
    setSavingName(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { error } = await supabase.from('profiles').update({ username: username.trim() }).eq('id', user.id)
    setSavingName(false)
    if (error) alert(error.message)
  }

  async function createEntry() {
    const text = content.trim()
    if (!text) return
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { error } = await supabase
      .from('entries')
      .insert({ user_id: user.id, content: text, is_public: publish })
    if (error) { alert(error.message); return }
    setContent(''); setPublish(false)
    await loadEntries(user.id)
  }

  async function removeEntry(id: string) {
    if (!confirm('Delete this entry?')) return
    const { error } = await supabase.from('entries').delete().eq('id', id)
    if (error) { alert(error.message); return }
    setEntries(prev => prev.filter(e => e.id !== id))
  }

  async function togglePublic(id: string, makePublic: boolean) {
    const { error } = await supabase.from('entries').update({ is_public: makePublic }).eq('id', id)
    if (error) { alert(error.message); return }
    setEntries(prev => prev.map(e => e.id === id ? { ...e, is_public: makePublic } : e))
  }

  // ---- UI ----
  if (loading) {
    return <main style={{ maxWidth: 720, margin: '40px auto' }}>Loading…</main>
  }

  return (
    <main style={{ maxWidth: 720, margin: '40px auto', fontFamily: 'system-ui' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2>MY JOURNAL</h2>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => router.push('/social')}>Community feed</button>
          <button onClick={async () => { await supabase.auth.signOut(); router.replace('/') }}>Sign out</button>
        </div>
      </header>

      {/* SECTION A: DISPLAY NAME */}
      <section style={{ marginTop: 16, paddingTop: 12, borderTop: '1px solid #ddd' }}>
        <h3 style={{ margin: '0 0 8px' }}>SECTION A: DISPLAY NAME</h3>
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Display name"
            style={{ flex: 1, padding: 8, border: '1px solid #ccc' }}
          />
          <button onClick={saveDisplayName} disabled={savingName}>
            {savingName ? 'Saving…' : 'Save'}
          </button>
        </div>
        <small style={{ color: '#666' }}>This name appears next to your published notes in the community feed.</small>
      </section>

      {/* SECTION B: NEW ENTRY */}
      <section style={{ marginTop: 24, paddingTop: 12, borderTop: '1px solid #ddd' }}>
        <h3 style={{ margin: '0 0 8px' }}>SECTION B: NEW ENTRY</h3>
        <textarea
          rows={6}
          placeholder="Write about your feelings / triggers…"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          style={{ width: '100%', padding: 10, border: '1px solid #ccc' }}
        />
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}>
          <label style={{ userSelect: 'none' }}>
            <input
              type="checkbox"
              checked={publish}
              onChange={(e) => setPublish(e.target.checked)}
            />{' '}
            Publish this note to the community feed
          </label>
          <div style={{ flex: 1 }} />
          <button onClick={createEntry}>Save</button>
        </div>
      </section>

      {/* GROUPED LIST BY DATE */}
      <section style={{ marginTop: 28, paddingTop: 12, borderTop: '1px solid #ddd' }}>
        <h3 style={{ margin: '0 0 8px' }}>Recent</h3>

        {sortedDays.length === 0 && <p>No entries yet.</p>}

        {sortedDays.map((dayKey) => (
          <div key={dayKey} style={{ margin: '20px 0' }}>
            <h4 style={{ margin: '0 0 6px' }}>{formatDateHeader(dayKey)}</h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {grouped[dayKey].map((it, idx) => (
                <li key={it.id} style={{ padding: '12px 0', borderBottom: '1px solid #eee' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                    <small style={{ color: '#666' }}>
                      ENTRY NO. {idx + 1} • {new Date(it.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </small>
                    <small style={{ color: it.is_public ? '#0a7' : '#667' }}>
                      {it.is_public ? '[ PUBLISHED ]' : '[ PRIVATE ]'}
                    </small>
                  </div>

                  <p style={{ margin: '6px 0 10px', whiteSpace: 'pre-wrap' }}>{it.content}</p>

                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <button type="button" onClick={() => router.push(`/dashboard/entry/${it.id}`)}>Edit</button>
                    <button type="button" onClick={() => removeEntry(it.id)}>Delete</button>
                    <button type="button" onClick={() => togglePublic(it.id, !(it.is_public ?? false))}>
                      {it.is_public ? 'Unpublish' : 'Publish'}
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </section>
    </main>
  )
}