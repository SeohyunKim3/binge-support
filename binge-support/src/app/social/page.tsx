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
  // when join works, profiles will be a single object with username
  profiles?: { username?: string | null } | null
}

export default function SocialPage() {
  const router = useRouter()

  const [session, setSession] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [items, setItems] = useState<FeedItem[]>([])
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true

    const bootstrap = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!mounted) return

      setSession(session)
      if (session) {
        await loadFeed()
      }
      setLoading(false)
    }

    bootstrap()

    const { data: sub } = supabase.auth.onAuthStateChange((_evt, sess) => {
      setSession(sess)
      if (sess) loadFeed()
      else setItems([])
    })

    return () => {
      mounted = false
      sub.subscription.unsubscribe()
    }
  }, [])

  async function loadFeed() {
    setErrorMsg(null)

    // 1) Try with join to profiles(username)
    const withJoin = await supabase
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

    if (!withJoin.error) {
      setItems((withJoin.data as FeedItem[]) ?? [])
      return
    }

    // 2) Fallback without join (still shows the feed)
    const simple = await supabase
      .from('entries')
      .select('id, user_id, content, created_at, is_public')
      .eq('is_public', true)
      .order('created_at', { ascending: false })
      .limit(200)

    if (simple.error) {
      console.error('feed error:', simple.error)
      setErrorMsg('Failed to load feed. Please try again.')
      return
    }

    setItems((simple.data as FeedItem[]) ?? [])
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

  if (!session) {
    return (
      <main style={{ maxWidth: 720, margin: '40px auto' }}>
        <h2>Community Feed</h2>
        <p>You must sign in to view published notes.</p>
        <button onClick={() => router.push('/')}>Go to sign in</button>
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

      {errorMsg && (
        <div style={{ marginTop: 12, padding: 12, border: '1px solid #f5c2c7', background: '#f8d7da' }}>
          {errorMsg}
        </div>
      )}

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

      <div style={{ marginTop: 16 }}>
        <button onClick={loadFeed}>Refresh</button>
      </div>
    </main>
  )
}