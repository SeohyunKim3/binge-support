'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../lib/supabaseClient'

type Entry = {
  id: string
  content: string
  created_at: string
}

export default function TrashPage() {
  const router = useRouter()
  const [entries, setEntries] = useState<Entry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.replace('/'); return }
      const { data, error } = await supabase
        .from('entries')
        .select('id, content, created_at')
        .eq('user_id', user.id)
        .eq('is_deleted', true)
        .order('created_at', { ascending: false })
      if (!error && data) setEntries(data)
      setLoading(false)
    })()
  }, [router])

  async function restoreEntry(id: string) {
    const { error } = await supabase
      .from('entries')
      .update({ is_deleted: false })
      .eq('id', id)
    if (!error) setEntries(prev => prev.filter(e => e.id !== id))
  }

  async function permanentlyDelete(id: string) {
    if (!confirm('영구 삭제하시겠어요? 되돌릴 수 없습니다.')) return
    const { error } = await supabase.from('entries').delete().eq('id', id)
    if (!error) setEntries(prev => prev.filter(e => e.id !== id))
  }

  if (loading) return <p>Loading...</p>

  return (
    <main style={{ padding: '40px 20px', maxWidth: 700, margin: '0 auto' }}>
      <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 16 }}>휴지통</h2>
      <p style={{ color: '#777', marginBottom: 20 }}>삭제된 기록들을 확인하고 복원하거나 완전히 삭제할 수 있습니다.</p>

      {entries.length === 0 ? (
        <p style={{ color: '#aaa' }}>휴지통이 비어있어요 🗑️</p>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: 16 }}>
          {entries.map(it => (
            <li key={it.id} style={{ background: '#fafafa', border: '1px solid #eee', borderRadius: 12, padding: 16 }}>
              <p style={{ whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>{it.content}</p>
              <p style={{ fontSize: 12, color: '#999', marginTop: 6 }}>
                {new Date(it.created_at).toLocaleString()}
              </p>
              <div style={{ marginTop: 8, display: 'flex', gap: 8 }}>
                <button
                  onClick={() => restoreEntry(it.id)}
                  style={{
                    background: '#a5d6a7',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 8,
                    padding: '6px 12px',
                    fontSize: 13,
                    cursor: 'pointer',
                  }}
                >
                  복원
                </button>
                <button
                  onClick={() => permanentlyDelete(it.id)}
                  style={{
                    background: '#ef9a9a',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 8,
                    padding: '6px 12px',
                    fontSize: 13,
                    cursor: 'pointer',
                  }}
                >
                  영구 삭제
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <div style={{ marginTop: 30 }}>
        <button
          className="btn-ghost"
          onClick={() => router.push('/dashboard')}
        >
          ← 나의 기록으로 돌아가기
        </button>
      </div>
    </main>
  )
}