'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../lib/supabaseClient' // adjust if needed

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
    if (!error) setEntries(prev => prev.filter(e => e.id !== id))
  }

  async function togglePublic(id: string, makePublic: boolean) {
    const { error } = await supabase.from('entries').update({ is_public: makePublic }).eq('id', id)
    if (!error) setEntries(prev => prev.map(e => e.id === id ? { ...e, is_public: makePublic } : e))
  }

  if (loading) return <main style={{ maxWidth: 720, margin: '40px auto' }}>Loading…</main>

  return (
    <main style={{ maxWidth: 720, margin: '40px auto', fontFamily: 'system-ui' }}>
      {/* Header */}
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2>MY JOURNAL</h2>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => router.push('/social')}>Community feed</button>
          <button onClick={async () => { await supabase.auth.signOut(); router.replace('/') }}>Sign out</button>
        </div>
      </header>

      {/* Small fixed username */}
      {username && (
        <p style={{ fontSize: '0.85rem', color: '#555', marginTop: 4, marginBottom: 20 }}>
          Signed in as <strong>{username}</strong>
        </p>
      )}

      {/* Journal writing area */}
      <section style={{ marginTop: 10 }}>
        <textarea
          rows={6}
          placeholder="Write about your thoughts or feelings..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          style={{
            width: '100%',
            padding: 10,
            border: '1px solid #ccc',
            borderRadius: 6,
            fontSize: '1rem',
            resize: 'vertical'
          }}
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

      {/* Entry list */}
      <section style={{ marginTop: 30 }}>
        {entries.length === 0 && <p>No entries yet.</p>}
        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
          {entries.map((it) => (
            <li key={it.id} style={{ padding: '12px 0', borderBottom: '1px solid #eee' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <small style={{ color: '#666' }}>
                  {new Date(it.created_at).toLocaleString()}
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
      </section>
    </main>
  )
}