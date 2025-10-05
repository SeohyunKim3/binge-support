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

{/* 본문 입력 */}
<div style={{ marginBottom: 24 }}>
  <h3 style={{
    fontSize: '15px',
    color: '#385c44',
    marginBottom: '6px',
    fontWeight: 600
  }}>본문</h3>

  <textarea
    className="paper-editor"
    value={content}
    onChange={(e) => setContent(e.target.value)}
    placeholder="Write freely…"
    style={{
      width: '100%',
      height: '240px', // ✅ 이전보다 확실히 작게
      border: '2px solid #b8d8b8',
      borderRadius: '12px',
      padding: '14px',
      fontSize: '15px',
      lineHeight: 1.6,
      background: '#fdfdfd',
      boxShadow: 'inset 0 1px 4px rgba(0,0,0,0.04)',
      resize: 'vertical',
      transition: 'border-color 0.2s ease',
    }}
    onFocus={(e) => e.currentTarget.style.borderColor = '#6ba292'}
    onBlur={(e) => e.currentTarget.style.borderColor = '#b8d8b8'}
  />
</div>

{/* 상세(마크다운) */}
<div style={{
  borderTop: '2px dashed #d8e7d8',
  paddingTop: '20px',
  marginTop: '16px'
}}>
  <h3 style={{
    fontSize: '15px',
    fontWeight: 700,
    color: '#335f3e',
    marginBottom: '10px'
  }}>
    상세 (마크다운)
    <span style={{
      fontSize: '12px',
      color: '#7a8a7a',
      marginLeft: '6px'
    }}>— 아이디어 확장 또는 세부 기록</span>
  </h3>

  <div style={{
    background: '#f7faf7',
    border: '1px solid #d3e5d3',
    borderRadius: '10px',
    padding: '12px 14px',
    boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.03)',
  }}>
    <textarea
      placeholder="여기에 세부 내용을 적어보세요..."
      rows={6}
      style={{
        width: '100%',
        border: 'none',
        outline: 'none',
        resize: 'vertical',
        background: 'transparent',
        fontSize: '14px',
        color: '#444',
        lineHeight: 1.5,
      }}
    />
  </div>

  <div style={{
    marginTop: '8px',
    fontSize: '12px',
    color: '#7a8a7a',
    textAlign: 'right',
    fontStyle: 'italic'
  }}>
    기록장 화면에서는 이렇게 보여요:
  </div>
</div>
      </div>
    </main>
  )
}