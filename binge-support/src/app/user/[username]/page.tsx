'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '../../../lib/supabaseClient'

type ProfileObj = { username: string | null }
type Entry = {
  id: string
  content: string
  created_at: string
  // profiles may come back as an object or an array depending on the FK naming / join
  profiles: ProfileObj | ProfileObj[] | null
}

function usernameOf(e: Entry): string | null {
  if (!e.profiles) return null
  return Array.isArray(e.profiles) ? e.profiles[0]?.username ?? null : e.profiles.username ?? null
}

export default function UserJournalPage() {
  const { username } = useParams<{ username: string }>()
  const router = useRouter()
  const [entries, setEntries] = useState<Entry[]>([])
  const [loading, setLoading] = useState(true)

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

      if (!error && data) {
        const target = decodeURIComponent(username)
        // filter by the resolved username from either object or array
        const filtered = (data as Entry[]).filter((it) => usernameOf(it) === target)
        setEntries(filtered)
      }
      setLoading(false)
    })()
  }, [username])

  if (loading) return null

  return (
    <main className="container">
      <div className="card" style={{ background: 'transparent', boxShadow: 'none' }}>
        <button className="btn-ghost2" style={{ marginBottom: '12px' }} onClick={() => router.push('/social')}>
          ← 돌아가기
        </button>

        <h2 className="page-title" style={{ marginBottom: 8 }}>
          @{decodeURIComponent(username)}’s Journal
        </h2>
        <p className="subtle">기록인의 공개된 모든 조각들의 모음</p>

        <div className="gallery-grid">
          {entries.map((it) => (
            <div key={it.id} className="gallery-card">
              <p className="gallery-text">{it.content}</p>
              <div className="gallery-date">
                {new Date(it.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </div>
            </div>
          ))}
          {entries.length === 0 && <p className="subtle">해당 기록인은 아직 공개된 조각이 없어요!</p>}
        </div>
      </div>
    </main>
  )
}