'use client'

import { useEffect, useRef, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '../../../../lib/supabaseClient'
import Markdown from '@/components/Markdown' // 미리보기용 (있으면 사용)

type EntryPatch = Partial<{
  id: string
  content: string
  is_public: boolean
  is_resolved: boolean
  details_md: string | null
}>

export default function EntryEditorPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // 본문
  const [content, setContent] = useState('')
  const [isPublic, setIsPublic] = useState(false)
  const [createdAt, setCreatedAt] = useState<string | null>(null)
  const [err, setErr] = useState<string | null>(null)

  // 상세(마크다운) — 자동 저장 대상
  const [detailsMd, setDetailsMd] = useState<string>('')    // textarea 값
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.replace('/'); return }

      const { data, error } = await supabase
        .from('entries')
        .select('*')
        .eq('id', id)
        .single()

      if (error) { setErr(error.message); setLoading(false); return }
      if (data.user_id !== user.id) { setErr('You do not have access to this entry'); setLoading(false); return }

      setContent(data.content ?? '')
      setIsPublic(!!data.is_public)
      setDetailsMd(data.details_md ?? '')          // ← 상세 초기값
      setCreatedAt(data.created_at)
      setLoading(false)
    }
    load()
  }, [id, router])

  // ── 본문 저장(버튼) ───────────────────────────────────────────────
  async function save() {
    setSaving(true)

    const { error } = await supabase
      .from('entries')
      .update({ content: content.trim(), is_public: isPublic })
      .eq('id', id)

    if (error) {
      setSaving(false)
      alert(error.message)
      return
    }

    const { data: fresh, error: fetchErr } = await supabase
      .from('entries')
      .select('id, content, is_public, is_resolved, details_md')
      .eq('id', id)
      .single()

    setSaving(false)
    if (fetchErr) { alert(fetchErr.message); return }

    // 대시보드에 즉시 반영
    window.dispatchEvent(new CustomEvent('entry-updated', {
      detail: {
        id: fresh.id,
        content: fresh.content,
        is_public: fresh.is_public,
        is_resolved: fresh.is_resolved,
        details_md: fresh.details_md,
      } as EntryPatch
    }))
  }

  // ── 상세(마크다운) 자동 저장 ────────────────────────────────────────
  useEffect(() => {
    if (loading) return
    if (!id) return

    // 디바운스 600ms
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(async () => {
      const next = detailsMd.trim() === '' ? null : detailsMd
      const { error } = await supabase
        .from('entries')
        .update({ details_md: next })
        .eq('id', id)
      if (error) return

      // 대시보드 실시간 반영
      window.dispatchEvent(new CustomEvent('entry-updated', {
        detail: { id, details_md: next } as EntryPatch
      }))
    }, 600)

    return () => { if (saveTimer.current) clearTimeout(saveTimer.current) }
  }, [detailsMd, id, loading])

  if (loading) return (
    <main className="paper-page">
      <div className="paper-wrap">Loading…</div>
    </main>
  )

  return (
    <main className="paper-page">
      <div className="paper-wrap">
        <div className="paper-bar">
          <button className="btn-ghost" onClick={() => router.push('/dashboard')}>← 이전으로</button>
          <div className="paper-actions">
            <button className="btn" onClick={save} disabled={saving}>
              {saving ? '저장중...' : '저장'}
            </button>
            <label className="subtle" style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
              <input type="checkbox" checked={isPublic} onChange={(e) => setIsPublic(e.target.checked)} />
              🪄 모두와 공유하기
            </label>
          </div>
        </div>

        {createdAt && <div className="paper-meta">만든일: {new Date(createdAt).toLocaleString()}</div>}
        {err && <div className="paper-meta" style={{ color: 'var(--danger)' }}>{err}</div>}

        {/* 본문(높이만 살짝 줄임) */}
        <h3 style={{ fontSize: 15, margin: '10px 0 6px' }}>본문</h3>
        <textarea
          className="paper-editor"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="자유롭게 적어보세요…"
          style={{ height: 240 }}
        />

        {/* 상세(마크다운) – 자동 저장 */}
        <div style={{ borderTop: '2px dashed #d8e7d8', paddingTop: 20, marginTop: 16 }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 10 }}>
            상세 (마크다운)
            <span style={{ fontSize: 12, color: '#7a8a7a', marginLeft: 6 }}>— 아이디어 확장 또는 세부 기록</span>
          </h3>

          <div style={{
            background: '#f7faf7', border: '1px solid #d3e5d3', borderRadius: 10,
            padding: '12px 14px', boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.03)'
          }}>
            <textarea
              value={detailsMd}
              onChange={(e) => setDetailsMd(e.target.value)}
              rows={6}
              placeholder="여기에 세부 내용을 적어보세요…"
              style={{
                width: '100%', border: 'none', outline: 'none', resize: 'vertical',
                background: 'transparent', fontSize: 14, lineHeight: 1.5
              }}
            />
          </div>

          {/* 미리보기 (Markdown 컴포넌트가 있다면 사용) */}
          <div style={{ marginTop: 10 }}>
            <div style={{
              fontSize: 12, color: '#7a8a7a', marginBottom: 6, textAlign: 'right', fontStyle: 'italic'
            }}>기록장 화면에서는 이렇게 보여요.</div>
            <div style={{
              background: '#fff', border: '1px solid #e8efe8', borderRadius: 10, padding: 12
            }}>
              {typeof Markdown === 'function'
                ? <Markdown content={detailsMd} />
                : <div style={{ whiteSpace: 'pre-wrap' }}>{detailsMd}</div>}
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}