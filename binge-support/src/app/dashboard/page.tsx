'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../lib/supabaseClient' // ← adjust if needed

type Entry = {
  id: string
  user_id: string
  content: string
  created_at: string
}

export default function Dashboard() {
  const router = useRouter()
  const [userId, setUserId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  // new entry
  const [content, setContent] = useState('')

  // list + editing
  const [entries, setEntries] = useState<Entry[]>([])
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingText, setEditingText] = useState('')

  // auth gate + initial load
  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      const uid = data.session?.user?.id ?? null
      if (!uid) {
        router.replace('/')
        return
      }
      setUserId(uid)
      await load(uid)
      setLoading(false)
    })
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      const uid = session?.user?.id ?? null
      if (!uid) router.replace('/')
    })
    return () => sub.subscription.unsubscribe()
  }, [router])

  async function load(uid: string) {
    const { data, error } = await supabase
      .from('entries')
      .select('*')
      .eq('user_id', uid)
      .order('created_at', { ascending: false })
      .limit(200)
    if (!error && data) setEntries(data as Entry[])
  }

  // CREATE
  async function createEntry(e: React.FormEvent) {
    e.preventDefault()
    if (!userId || !content.trim()) return
    const text = content.trim()
    setContent('')

    // optimistic add
    const temp: Entry = {
      id: 'temp-' + Date.now(),
      user_id: userId,
      content: text,
      created_at: new Date().toISOString(),
    }
    setEntries((prev) => [temp, ...prev])

    const { data, error } = await supabase
      .from('entries')
      .insert({ user_id: userId, content: text })
      .select()
      .single()

    if (error) {
      alert(error.message)
      // revert optimistic
      setEntries((prev) => prev.filter((e) => e.id !== temp.id))
    } else if (data) {
      // swap temp with real
      setEntries((prev) => [data as Entry, ...prev.filter((e) => e.id !== temp.id)])
    }
  }

  // DELETE
  async function removeEntry(id: string) {
    if (!confirm('Delete this entry?')) return
    const keep = entries.filter((e) => e.id !== id)
    setEntries(keep) // optimistic
    const { error } = await supabase.from('entries').delete().eq('id', id)
    if (error) {
      alert(error.message)
      // restore
      await load(userId!)
    }
  }

  // EDIT
  function startEdit(entry: Entry) {
    setEditingId(entry.id)
    setEditingText(entry.content)
  }
  function cancelEdit() {
    setEditingId(null)
    setEditingText('')
  }
  async function saveEdit(id: string) {
    const text = editingText.trim()
    if (!text) return
    // optimistic update
    setEntries((prev) => prev.map((e) => (e.id === id ? { ...e, content: text } as Entry : e)))
    setEditingId(null)
    setEditingText('')
    const { error } = await supabase.from('entries').update({ content: text }).eq('id', id)
    if (error) {
      alert(error.message)
      await load(userId!)
    }
  }

  async function signOut() {
    await supabase.auth.signOut()
    router.replace('/')
  }

  if (loading) {
    return <main style={{ maxWidth: 720, margin: '40px auto' }}>Loading…</main>
  }

  return (
    <main style={{ maxWidth: 720, margin: '40px auto', fontFamily: 'system-ui' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2>My journal</h2>
        <button onClick={signOut}>Sign out</button>
      </header>

      {/* create */}
      <form onSubmit={createEntry} style={{ display: 'grid', gap: 8, marginTop: 12 }}>
        <textarea
          rows={6}
          placeholder="Write about your feelings / triggers…"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          style={{ padding: 8 }}
        />
        <button disabled={!content.trim()}>Save</button>
      </form>

      {/* list */}
      <section style={{ marginTop: 24 }}>
        <h3>Recent</h3>
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {entries.map((it) => (
            <li key={it.id} style={{ padding: '12px 0', borderBottom: '1px solid #eee' }}>
              <small>{new Date(it.created_at).toLocaleString()}</small>

              {editingId === it.id ? (
                <div style={{ marginTop: 8, display: 'grid', gap: 8 }}>
                  <textarea
                    rows={4}
                    value={editingText}
                    onChange={(e) => setEditingText(e.target.value)}
                    style={{ padding: 8 }}
                  />
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button type="button" onClick={() => saveEdit(it.id)}>Save</button>
                    <button type="button" onClick={cancelEdit}>Cancel</button>
                  </div>
                </div>
              ) : (
                <>
                  <p style={{ margin: '6px 0 8px' }}>{it.content}</p>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button type="button" onClick={() => startEdit(it)}>Edit</button>
                    <button type="button" onClick={() => removeEntry(it.id)}>Delete</button>
                  </div>
                </>
              )}
            </li>
          ))}
          {!entries.length && <li>No entries yet.</li>}
        </ul>
      </section>
    </main>
  )
}