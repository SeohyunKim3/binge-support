'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabaseClient'

type Entry = {
  id: string
  content: string
  created_at: string
  profiles?: { username?: string | null } | null
}

export default function SocialPage() {
  const [entries, setEntries] = useState<Entry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from('entries')
        .select(`
          id,
          content,
          created_at,
          profiles ( username )
        `)
        .eq('is_public', true)
        .order('created_at', { ascending: false })
      if (!error) setEntries(data as Entry[])
      setLoading(false)
    })()
  }, [])

  if (loading) return null

  return (
    <main className="container">
      <div className="card" style={{ background: 'transparent', boxShadow: 'none' }}>
        <h2 className="page-title" style={{ marginBottom: 8 }}>Community Feed</h2>
        <p className="subtle">See what others have shared</p>

        <div className="gallery-grid">
          {entries.map((it) => (
            <div key={it.id} className="gallery-card">
              <div className="gallery-user">@{it.profiles?.username ?? 'anonymous'}</div>
              <p className="gallery-text">{it.content}</p>
              <div className="gallery-date">
                {new Date(it.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </div>
            </div>
          ))}
          {entries.length === 0 && <p className="subtle">No public posts yet.</p>}
        </div>
      </div>
    </main>
  )
}