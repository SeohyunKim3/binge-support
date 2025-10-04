'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../lib/supabaseClient'

type FeedItem = {
  id: string
  user_id: string
  content: string
  created_at: string
  is_public: boolean
  profiles?: { username?: string | null } | null
}

export default function SocialPage() {
  const router = useRouter()

  const [loading, setLoading] = useState(true)
  const [isAuthed, setIsAuthed] = useState<boolean | null>(null)
  const [items, setItems] = useState<FeedItem[]>([])

  // Load once, then subscribe to auth changes
  useEffect(() => {
    let mounted = true

    const bootstrap = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!mounted) return
      setIsAuthed(!!session)
      if (session) await loadFeed()
      setLoading(false)
    }

    bootstrap()

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthed(!!session)
      if (session) loadFeed()
      else setItems([])
    })

    return () => {
      mounted = false
      sub.subscription.unsubscribe()
    }
  }, [])

  async function loadFeed() {
    const { data, error } = await supabase
      .from('entries')
      .select(`
        id,
        user_id,
        content,
        created_at,
        is_public,
        profiles ( username )
      `)
      .eq('is_public', true)
      .order('created_at', { ascending: false })
      .limit(200)

    if (!error && data) setItems(data as FeedItem[])
  }

  async function signOut() {
    await supabase.auth.signOut()
    router.replace('/')
  }

  const nameOf = (it: FeedItem) =>
    (it.profiles?.username && it.profiles.username.trim()) || 'Anonymous'

  if (loading) {
    return <main style={{ maxWidth: 720, margin: '40px auto' }}>Loading…</main>
  }

  if (!isAuthed) {
    // not signed in after session resolved
    return (
      <main style={{ maxWidth: 720, margin: '40px auto' }}>
        <h2>Community Feed</h2>
        <p>Please sign in to view published notes.</p>
        <button onClick={() => router.replace('/')}>Go to sign in</button>
      </main>
    )
  }

  return (
    <main style={{ maxWidth: 720, margin: '40px auto', fontFamily: 'system-ui' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2>Community Feed</h2>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => router.push('/dashboard')}>My journal</button>
          <button onClick={signOut}>Sign out</button>
        </div>
      </header>

      <p style={{ color: '#666', marginTop: 8 }}>
        Notes members chose to publish. Please be kind & respectful.
      </p>

      <ul style={{ listStyle: 'none', padding: 0, marginTop: 16 }}>
        {items.map((it) => (
          <li key={it.id} style={{ padding: '14px 0', borderBottom: '1px solid #eee' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <strong>{nameOf(it)}</strong>
              <small>{new Date(it.created_at).toLocaleString()}</small>
            </div>
            <p style={{ margin: '8px 0 0' }}>{it.content}</p>
          </li>
        ))}
        {!items.length && <li>No published entries yet.</li>}
      </ul>
    </main>
  )
}