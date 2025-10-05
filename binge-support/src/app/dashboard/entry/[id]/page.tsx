'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '../../../../lib/supabaseClient'
import Markdown from '@/components/Markdown'

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
  const [details, setDetails] = useState('')            // ✅ details_md 편집용
  const [isPublic, setIsPublic] = useState(false)
  const [createdAt, setCreatedAt] = useState<string | null>(null)
  const [err, setErr] = useState<string | null>(null)

  // 초기 로드
  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.replace('/'); return }

      const { data, error } = await supabase
        .from('entries')
        .select('id,user_id,content,details_md,is_public,created_at,is_resolved')
        .eq('id', id)
        .single()

      if (error) { setErr(error.message); setLoading(false); return }
      if (data.user_id !== user.id) { setErr('You do not have access to this entry'); setLoading(false); return }

      setContent(data.content ?? '')
      setDetails(data.details_md ?? '')                  // ✅ details_md 로드
      setIsPublic(!!data.is_public)
      setCreatedAt(data.created_at)
      setLoading(false)
    }
    load()
  }, [id, router])

  // 저장 (수동/체크박스 변경/단축키 공용)
  async function save(patch?: EntryPatch) {
    if (saving) return
    setSaving(true)

    // 기본 페이로드 + 선택 패치
    const payload: EntryPatch = {
      content: content.trim(),
      details_md: details.trim(),
      is_public: isPublic,
      ...(patch ?? {}),
    }

    const { error } = await supabase
      .from('entries')
      .update(payload)
      .eq('id', id)

    if (error) {
      setSaving(false)
      alert(error.message)
      return
    }

    // 최신 레코드 재조회(확실한 동기화)
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

    // 대시보드/타 탭에 즉시 반영되도록 이벤트 발행
    window.dispatchEvent(
      new CustomEvent('entry-updated', {
        detail: {
          id: fresh.id,
          content: fresh.content,
          is_public: fresh.is_public,
          is_resolved: fresh.is_resolved,
          details_md: fresh.details_md,
        } as EntryPatch,
      })
    )
  }

  // ⌘/Ctrl+S 로 저장
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const isMac = navigator.platform.toLowerCase().includes('mac')
      if ((isMac && e.metaKey && e.key.toLowerCase() === 's') ||
          (!isMac && e.ctrlKey && e.key.toLowerCase() === 's')) {
        e.preventDefault()
        save()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [content, details, isPublic])

  if (loading) return <main className="paper-page"><div className="paper-wrap">Loading…</div></main>

  return (
    <main className="paper-page">
      <div className="paper-wrap">
        <div className="paper-bar">
          <button className="btn-ghost" onClick={() => router.push('/dashboard')}>← 이전으로</button>
          <div className="paper-actions">
            <button className="btn" onClick={() => save()} disabled={saving}>
              {saving ? '저장중...' : '저장'}
            </button>
            <label className="subtle" style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
              <input
                type="checkbox"
                checked={isPublic}
                onChange={async (e) => {
                  // ✅ 토글 즉시 저장
                  setIsPublic(e.target.checked)
                  await save({ is_public: e.target.checked })
                }}
              />
              🪄 모두와 공유하기
            </label>
          </div>
        </div>

        {createdAt && <div className="paper-meta">만든일: {new Date(createdAt).toLocaleString()}</div>}
        {err && <div className="paper-meta" style={{ color: 'var(--danger)' }}>{err}</div>}

        {/* 본문 편집 */}
        <h3 style={{ marginTop: 16, marginBottom: 8 }}>본문</h3>
        <textarea
          className="paper-editor"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Write freely…"
        />

        {/* 마크다운 상세 편집 + 미리보기 */}
        <h3 style={{ marginTop: 16, marginBottom: 8 }}>상세(마크다운)</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <textarea
            className="paper-editor"
            style={{ minHeight: 240 }}
            value={details}
            onChange={(e) => setDetails(e.target.value)}
            placeholder="### 예시\n- 항목 1\n- 항목 2"
          />
          <div>
            <div className="paper-meta" style={{ marginBottom: 8 }}>미리보기</div>
            <Markdown content={details} />
          </div>
        </div>
      </div>
    </main>
  )
}