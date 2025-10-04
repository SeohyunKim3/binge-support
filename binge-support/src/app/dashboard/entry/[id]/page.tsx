'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '../../../../lib/supabaseClient'

// 수정에 보낼 필드만 부분적으로 허용
type EntryPatch = Partial<{
  content: string;
  is_public: boolean;
  is_resolved: boolean;
  details_md: string | null;
}>;

export default function EntryEditorPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [content, setContent] = useState('')
  const [isPublic, setIsPublic] = useState(false)
  const [createdAt, setCreatedAt] = useState<string | null>(null)
  const [err, setErr] = useState<string | null>(null)

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.replace('/'); return }
      const { data, error } = await supabase.from('entries').select('*').eq('id', id).single()
      if (error) { setErr(error.message); setLoading(false); return }
      if (data.user_id !== user.id) { setErr('You do not have access to this entry'); setLoading(false); return }
      setContent(data.content ?? '')
      setIsPublic(!!data.is_public)
      setCreatedAt(data.created_at)
      setLoading(false)
    }
    load()
  }, [id, router])

  async function save() {
    setSaving(true)
  
    // 1) 내용/공개여부 저장
    const { error } = await supabase
      .from('entries')
      .update({ content: content.trim(), is_public: isPublic })
      .eq('id', id)
  
    if (error) {
      setSaving(false)
      alert(error.message)
      return
    }
  
    // 2) 최신 레코드(특히 details_md 포함) 다시 조회
    const { data: fresh, error: fetchErr } = await supabase
      .from('entries')
      .select('id, content, is_public, details_md, is_resolved')
      .eq('id', id)
      .single()
  
    setSaving(false)
  
    if (fetchErr) {
      alert(fetchErr.message)
      return
    }
  
    // 3) ✅ 대시보드/다른 뷰가 즉시 반영되도록 전역 이벤트 발행
    window.dispatchEvent(
      new CustomEvent('entry-updated', {
        detail: {
          id: fresh.id,
          content: fresh.content,
          is_public: fresh.is_public,
          is_resolved: fresh.is_resolved,
          details_md: fresh.details_md, // 👈 디테일도 함께
        } as EntryPatch,
      })
    )
  }

  if (loading) return <main className="paper-page"><div className="paper-wrap">Loading…</div></main>

  return (
    <main className="paper-page">
      <div className="paper-wrap">
        <div className="paper-bar">
          <button className="btn-ghost" onClick={() => router.push('/dashboard')}>← 이전으로</button>
          <div className="paper-actions">
            <button className="btn" onClick={save} disabled={saving}>{saving ? '저장중...' : '저장'}</button>
            <label className="subtle" style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
              <input type="checkbox" checked={isPublic} onChange={(e) => setIsPublic(e.target.checked)} />
              🪄 모두와 공유하기
            </label>
          </div>
        </div>

        {createdAt && <div className="paper-meta">만든일: {new Date(createdAt).toLocaleString()}</div>}
        {err && <div className="paper-meta" style={{ color: 'var(--danger)' }}>{err}</div>}

        <textarea
          className="paper-editor"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Write freely…"
        />
      </div>
    </main>
  )
}