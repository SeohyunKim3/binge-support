'use client'

import React, { useEffect, useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../lib/supabaseClient' // adjust if your path differs

type Entry = {
  id: string
  user_id: string
  content: string
  created_at: string
  is_public?: boolean
}

type Profile = {
  id: string
  username: string | null
}

export default function Dashboard() {
  const router = useRouter()

  // auth & user
  const [userId, setUserId] = useState<string | null>(null)
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  // profile (display name)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [username, setUsername] = useState('')

  // create form
  const [content, setContent] = useState('')
  const [publish, setPublish] = useState(false)

  // list & edit state
  const [entries, setEntries] = useState<Entry[]>([])
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingText, setEditingText] = useState('')

  // ---- bootstrap: auth -> profile -> entries
  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      const uid = data.session?.user?.id ?? null
      const email = data.session?.user?.email ?? null
      if (!uid) {
        router.replace('/')
        return
      }
      setUserId(uid)
      setUserEmail(email)

      await ensureProfile(uid, email || undefined)
      await loadEntries(uid)

      setLoading(false)
    })

    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      const uid = session?.user?.id ?? null
      if (!uid) router.replace('/')
    })
    return () => sub.subscription.unsubscribe()
  }, [router])

  async function ensureProfile(uid: string, email?: string) {
    // fetch profile
    const { data, error } = await supabase
      .from('profiles')
      .select('id, username')
      .eq('id', uid)
      .maybeSingle()

    if (error) {
      console.error(error)
      return
    }

    if (!data) {
      // create default username from email prefix if possible
      const defaultName = email ? email.split('@')[0] : `user_${uid.slice(0, 6)}`
      const { data: created, error: insertErr } = await supabase
        .from('profiles')
        .insert({ id: uid, username: defaultName })
        .select()
        .single()
      if (insertErr) {
        console.error(insertErr)
        return
      }
      setProfile(created as Profile)
      setUsername(created.username ?? '')
    } else {
      setProfile(data as Profile)
      setUsername((data as Profile).username ?? '')
    }
  }

  async function saveUsername() {
    if (!userId) return
    const newName = username.trim()
    if (!newName) return
    const { error } = await supabase
      .from('profiles')
      .update({ username: newName })
      .eq('id', userId)
    if (error) {
      alert(error.message)
      return
    }
    setProfile((p) => (p ? { ...p, username: newName } : p))
  }

  async function loadEntries(uid: string) {
    const { data, error } = await supabase
      .from('entries')
      .select()
      .eq('user_id', uid)
      .order('created_at', { ascending: false })
      .limit(200)
    if (!error && data) setEntries(data as Entry[])
  }

  // ---- CRUD

  async function createEntry(e: FormEvent) {
    e.preventDefault()
    if (!userId || !content.trim()) return
    const textVal = content.trim()
    setContent('')

    // optimistic add
    const temp: Entry = {
      id: 'temp-' + Date.now(),
      user_id: userId,
      content: textVal,
      created_at: new Date().toISOString(),
      is_public: publish,
    }
    setEntries((prev) => [temp, ...prev])

    const { data, error } = await supabase
      .from('entries')
      .insert({ user_id: userId, content: textVal, is_public: publish })
      .select()
      .single()

    if (error) {
      alert(error.message)
      setEntries((prev) => prev.filter((e) => e.id !== temp.id))
    } else if (data) {
      setEntries((prev) => [data as Entry, ...prev.filter((e) => e.id !== temp.id)])
    }
  }

  function startEdit(entry: Entry) {
    setEditingId(entry.id)
    setEditingText(entry.content)
  }
  function cancelEdit() {
    setEditingId(null)
    setEditingText('')
  }
  async function saveEdit(id: string) {
    const textVal = editingText.trim()
    if (!textVal) return
    setEntries((prev) => prev.map((e) => (e.id === id ? { ...e, content: textVal } : e)))
    setEditingId(null)
    setEditingText('')
    const { error } = await supabase.from('entries').update({ content: textVal }).eq('id', id)
    if (error) {
      alert(error.message)
      if (userId) await loadEntries(userId)
    }
  }

  async function togglePublic(id: string, value: boolean) {
    const before = entries
    setEntries(before.map((e) => (e.id === id ? { ...e, is_public: value } : e)))
    const { error } = await supabase.from('entries').update({ is_public: value }).eq('id', id)
    if (error) {
      alert(error.message)
      setEntries(before)
    }
  }

  async function removeEntry(id: string) {
    if (!confirm('Delete this entry?')) return
    const keep = entries.filter((e) => e.id !== id)
    setEntries(keep)
    const { error } = await supabase.from('entries').delete().eq('id', id)
    if (error) {
      alert(error.message)
      if (userId) await loadEntries(userId)
    }
  }

  async function signOut() {
    await supabase.auth.signOut()
    router.replace('/')
  }

  // ---- UI

  if (loading) {
    return <main style={{ maxWidth: 720, margin: '40px auto' }}>Loading…</main>
  }

  return (
    <main style={{ maxWidth: 720, margin: '40px auto', fontFamily: 'system-ui' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ marginBottom: 4 }}>My journal</h2>
          <small style={{ color: '#666' }}>{userEmail}</small>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => router.push('/social')}>Community feed</button>
          <button onClick={signOut}>Sign out</button>
        </div>
      </header>

      {/* profile card */}
      <section
        style={{
          marginTop: 16,
          padding: 12,
          border: '1px solid #eee',
          borderRadius: 8,
          background: '#fafafa',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <label style={{ fontWeight: 600 }}>Display name</label>
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Your name"
            style={{ padding: 8, minWidth: 220 }}
          />
          <button onClick={saveUsername}>Save</button>
        </div>
        <small style={{ color: '#666' }}>
          This name appears next to your published notes in the community feed.
        </small>
      </section>

      {/* create */}
      <form onSubmit={createEntry} style={{ display: 'grid', gap: 8, marginTop: 16 }}>
        <textarea
          rows={6}
          placeholder="Write about your feelings / triggers…"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          style={{ padding: 8 }}
        />
        <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <input
            type="checkbox"
            checked={publish}
            onChange={(e) => setPublish(e.target.checked)}
          />
          Publish this note to the community feed (others can read it)
        </label>
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
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <button type="button" onClick={() => saveEdit(it.id)}>Save</button>
                    <button type="button" onClick={cancelEdit}>Cancel</button>
                  </div>
                </div>
              ) : (
                <>
                  <p style={{ margin: '6px 0 8px' }}>{it.content}</p>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <button type="button" onClick={() => startEdit(it)}>Edit</button>
                    <button type="button" onClick={() => removeEntry(it.id)}>Delete</button>
                    <button type="button" onClick={() => togglePublic(it.id, !(it.is_public ?? false))}>
                      {it.is_public ? 'Unpublish' : 'Publish'}
                    </button>
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