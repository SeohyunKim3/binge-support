'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../lib/supabaseClient'

type Entry = {
  id: string
  user_id: string
  content: string
  created_at: string
  is_public?: boolean
}

export default function Home() {
  const router = useRouter()
  const [session, setSession] = useState<any>(null)
  const [entries, setEntries] = useState<Entry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      if (data.session) {
        loadEntries()
      }
    })
  }, [])

  async function loadEntries() {
    const { data, error } = await supabase
      .from('entries')
      .select('id, user_id, content, created_at, is_public')
      .eq('is_public', true)
      .order('created_at', { ascending: false })
      .limit(50)

    if (!error && data) {
      setEntries(data as Entry[])
    }
    setLoading(false)
  }

  async function signOut() {
    await supabase.auth.signOut()
    router.replace('/')
  }

  if (!session) {
    return (
      <main style={{ maxWidth: 720, margin: '40px auto' }}>
        <h1>Binge Support (MVP)</h1>
        <p>Please sign in.</p>
      </main>
    )
  }

  return (
    <main style={{ maxWidth: 720, margin: '40px auto', fontFamily: 'system-ui' }}>
      <h1>Dolla (MVP))</h1>
      <p>Private space to log triggers & feelings.</p>

      <p>
        Signed in as <strong>{session.user.email}</strong>
      </p>
      <div style={{ display: 'flex', gap: 8 }}>
        <button onClick={() => router.push('/dashboard')}>Go to my journal</button>
        <button onClick={signOut}>Sign out</button>
      </div>

      <hr style={{ margin: '32px 0' }} />

      <h2>Community feed</h2>
      <p style={{ color: '#666' }}>Published journals from the community:</p>

      {loading ? (
        <p>Loading…</p>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {entries.map((it) => (
            <li key={it.id} style={{ padding: '12px 0', borderBottom: '1px solid #eee' }}>
              <small>{new Date(it.created_at).toLocaleString()}</small>
              <p style={{ margin: '6px 0 0' }}>{it.content}</p>
            </li>
          ))}
          {!entries.length && <li>No public entries yet.</li>}
        </ul>
      )}

      <hr style={{ margin: '32px 0' }} />
    </main>
  )
}