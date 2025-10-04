'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../lib/supabaseClient'

type Entry = {
  id: string
  content: string
  created_at: string
  profiles?: { username?: string | null } | null
}

export default function CommunityFeedPage() {
  const [entries, setEntries] = useState<Entry[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    ;(async () => {
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

      if (!error && data) setEntries(data as Entry[])
      setLoading(false)
    })()
  }, [])

  if (loading) return null

  return (
    <main className="container">
      <div className="card" style={{ background: '#fff', padding: '16px' }}>
        {/* ✅ 추가: 뒤로가기 버튼 (디자인 그대로, 한 줄만 추가) */}
        <button
          className="btn-ghost"
          style={{ marginBottom: '12px' }}
          onClick={() => router.push('/dashboard')}
        >
          ← Back to My Journal
        </button>

        <h2 className="page-title" style={{ marginBottom: 8 }}>
          Community Feed
        </h2>
        <p className="subtle">Notes members chose to publish. Please be kind & respectful.</p>

        <div className="gallery-grid">
          {entries.map((it) => (
            <div key={it.id} className="gallery-card">
              <button
                className="username-link"
                onClick={() => router.push(`/user/${it.profiles?.username}`)}
                style={{ fontWeight: 'bold', marginBottom: '4px' }}
              >
                @{it.profiles?.username || 'Anonymous'}
              </button>
              <p className="gallery-text">{it.content}</p>
              <div className="gallery-date">
                {new Date(it.created_at).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                })}
              </div>
            </div>
          ))}
          {entries.length === 0 && <p className="subtle">No community posts yet.</p>}
        </div>
      </div>
    </main>
  )
}