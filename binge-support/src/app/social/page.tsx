'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../lib/supabaseClient'

type Entry = {
  id: string
  user_id: string
  content: string
  created_at: string
  is_public?: boolean
}

export default function SocialPage() {
  const router = useRouter()
  const [entries, setEntries] = useState<Entry[]>([])
  const [loading, setLoading] = useState(true)

  // check login
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session?.user) {
        router.replace('/')
        return
      }
      load()
    })
  }, [router])

  async function load() {
    const { data, error } = await supabase
      .from('entries')
      .select('id, user_id, content, created_at, is_public')
      .eq('is_public', true)
      .order('created_at', { ascending: false })
      .limit(200)

    if (error) {
      console.error(error)
    } else if (data) {
      setEntries(data as Entry[])
    }
    setLoading(false)
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
        <h2>Community Feed</h2>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => router.push('/dashboard')}>My journal</button>
          <button onClick={signOut}>Sign out</button>
        </div>
      </header>

      <section style={{ marginTop: 24 }}>
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {entries.map((it) => (
            <li key={it.id} style={{ padding: '12px 0', borderBottom: '1px solid #eee' }}>
              <small>{new Date(it.created_at).toLocaleString()}</small>
              <p style={{ margin: '6px 0 0' }}>{it.content}</p>
            </li>
          ))}
          {!entries.length && <li>No public entries yet.</li>}
        </ul>
      </section>
    </main>
  )
}