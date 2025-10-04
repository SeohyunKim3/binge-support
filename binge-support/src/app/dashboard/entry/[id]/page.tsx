'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '../../../../lib/supabaseClient' // <-- if needed, change to the correct relative path

type Entry = {
  id: string
  user_id: string
  content: string
  created_at: string
  is_public: boolean
}

export default function EntryEditorPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const [content, setContent] = useState('')
  const [isPublic, setIsPublic] = useState(false)
  const [createdAt, setCreatedAt] = useState<string | null>(null)
  const [ownerEmail, setOwnerEmail] = useState<string | null>(null)
  const [err, setErr] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true

    const load = async () => {
      setErr(null)

      // must be signed in
      const { data: { user }, error: userErr } = await supabase.auth.getUser()
      if (userErr) { setErr(userErr.message); setLoading(false); return }
      if (!user) { router.replace('/'); return }

      // load entry
      const { data, error } = await supabase
        .from('entries')
        .select('id, user_id, content, created_at, is_public')
        .eq('id', id)
        .single()

      if (error) { setErr(error.message); setLoading(false); return }
      if (!data) { setErr('Entry not found'); setLoading(false); return }

      // (RLS already protects this, but we double-check)
      if (data.user_id !== user.id) {
        setErr('You do not have access to this entry')
        setLoading(false)
        return
      }

      if (!mounted) return
      setContent(data.content ?? '')
      setIsPublic(!!data.is_public)
      setCreatedAt(data.created_at)
      setOwnerEmail(user.email ?? null)
      setLoading(false)
    }

    load()
    return () => { mounted = false }
  }, [id, router])

  async function save() {
    setSaving(true)
    setErr(null)

    const { error } = await supabase
      .from('entries')
      .update({ content: content.trim(), is_public: isPublic })
      .eq('id', id)

    setSaving(false)
    if (error) { setErr(error.message); return }
    // optional toast/indicator
  }

  async function remove() {
    if (!confirm('Delete this entry? This cannot be undone.')) return
    setDeleting(true)
    const { error } = await supabase.from('entries').delete().eq('id', id)
    setDeleting(false)
    if (error) { setErr(error.message); return }
    router.replace('/dashboard')
  }

  if (loading) {
    return (
      <main className="entry-shell">
        <div className="entry-bar"><span>Loading…</span></div>
      </main>
    )
  }

  return (
    <main className="entry-shell">
      <div className="entry-bar">
        <div className="left">
          <button className="btn" onClick={() => router.push('/dashboard')}>← Back to my journal</button>
        </div>
        <div className="right">
          <button className="btn" onClick={save} disabled={saving}>
            {saving ? 'Saving…' : 'Save'}
          </button>
          <button className="btn danger" onClick={remove} disabled={deleting}>
            {deleting ? 'Deleting…' : 'Delete'}
          </button>
        </div>
      </div>

      <header className="entry-header">
        <h1>Journal Entry</h1>
        <div className="meta">
          {ownerEmail && <span>User: {ownerEmail}</span>}
          {createdAt && <span>Created: {new Date(createdAt).toLocaleString()}</span>}
        </div>
      </header>

      {err && <div className="entry-error">{err}</div>}

      <section className="entry-editor">
        <textarea
          className="editor-area"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Write freely…"
        />
        <label className="publish-row">
          <input
            type="checkbox"
            checked={isPublic}
            onChange={(e) => setIsPublic(e.target.checked)}
          />
          Publish this note to the community feed
        </label>
      </section>
    </main>
  )
}