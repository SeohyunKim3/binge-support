'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '../../../../lib/supabaseClient'

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
    const { error } = await supabase.from('entries').update({ content: content.trim(), is_public: isPublic }).eq('id', id)
    setSaving(false)
    if (error) alert(error.message)
  }

  if (loading) return <main className="paper-page"><div className="paper-wrap">Loading…</div></main>

  return (
    <main className="paper-page">
      <div className="paper-wrap">
        <div className="paper-bar">
          <button className="btn-ghost" onClick={() => router.push('/dashboard')}>← 이전으로</button>
          <div className="paper-actions">
            <button className="btn" onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Save'}</button>
            <label className="subtle" style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
              <input type="checkbox" checked={isPublic} onChange={(e) => setIsPublic(e.target.checked)} />
              Publish to community
            </label>
          </div>
        </div>

        {createdAt && <div className="paper-meta">Created: {new Date(createdAt).toLocaleString()}</div>}
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