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
          is_public,
          is_deleted,
          profiles ( username )
        `)
        .eq('is_public', true)
        .eq('is_deleted', false)
        .order('created_at', { ascending: false })

      if (!error && data) setEntries(data as Entry[])
      setLoading(false)
    })()
  }, [])

  if (loading) return null

  return (
    <main className="container">
      <div className="card" style={{ background: 'transparent', boxShadow: 'none', padding: 16 }}>
        {/* 돌아가기 버튼 (저널로) */}
        <button
          className="btn-ghost2"
          style={{ marginBottom: 12 }}
          onClick={() => router.push('/dashboard')}
        >
          ← 기록으로 돌아가기
        </button>

        <h2 className="page-title" style={{ marginBottom: 8 }}>조각 모음</h2>
        <p className="subtle">서로의 조각을 천천히 읽어보세요. 마음에 드는 분의 프로필을 확인해보세요.</p>

        <div className="gallery-grid">
          {entries.map((it) => (
            <div key={it.id} className="gallery-card">
              {/* ✅ 예전 스타일로 복구: 회색 배경 제거, 초록색 텍스트 */}
              <button
                className="link"
                style={{
                  fontWeight: 700,
                  color: '#7fb6a4',
                  marginBottom: 8,
                  padding: 0,
                }}
                onClick={() =>
                  router.push(`/user/${encodeURIComponent(it.profiles?.username ?? 'anonymous')}`)
                }
              >
                @{it.profiles?.username ?? 'anonymous'}
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

          {entries.length === 0 && <p className="subtle">아직 다른 분들의 조각이 없어요!.</p>}
        </div>
      </div>
    </main>
  )
}