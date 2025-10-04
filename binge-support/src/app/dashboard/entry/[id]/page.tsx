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

      const { data, error } = await supabase
        .from('entries')
        .select('*')
        .eq('id', id)
        .single()

      if (error) { setErr(error.message); setLoading(false); return }

      if (data.user_id !== user.id) {
        setErr('You do not have access to this entry')
        setLoading(false)
        return
      }

      setContent(data.content ?? '')
      setIsPublic(!!data.is_public)
      setCreatedAt(data.created_at)
      setLoading(false)
    }

    load()
  }, [id, router])

  async function save() {
    setSaving(true)
    const { error } = await supabase
      .from('entries')
      .update({ content: content.trim(), is_public: isPublic })
      .eq('id', id)
    setSaving(false)
    if (error) alert(error.message)
  }

  if (loading) return <main style={{ padding: 60 }}>Loading…</main>

  return (
    <main
      style={{
        minHeight: '100vh',
        backgroundColor: '#fffef8',
        backgroundImage: `
          repeating-linear-gradient(
            to bottom,
            #fffef8 0px,
            #fffef8 22px,
            #dce0e5 23px
          )
        `,
        fontFamily: '"Noto Serif KR", serif',
        padding: '40px 20px 60px',
      }}
    >
      <div style={{
        maxWidth: 800,
        margin: '0 auto',
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 20,
        }}>
          <button onClick={() => router.push('/dashboard')}>← Back</button>
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={save} disabled={saving}>
              {saving ? 'Saving…' : 'Save'}
            </button>
          </div>
        </div>

        {createdAt && (
          <small style={{ color: '#555' }}>
            Created: {new Date(createdAt).toLocaleString()}
          </small>
        )}

        {err && (
          <p style={{ color: '#a00', background: '#fee', padding: 8, borderRadius: 6 }}>
            {err}
          </p>
        )}

        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          style={{
            width: '100%',
            minHeight: 520,
            border: 'none',
            background: 'transparent',
            resize: 'none',
            lineHeight: '1.6',
            fontSize: '16px',
            outline: 'none',
            padding: '12px 8px',
          }}
          placeholder="Write freely..."
        />

        <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 10 }}>
          <input
            type="checkbox"
            checked={isPublic}
            onChange={(e) => setIsPublic(e.target.checked)}
          />
          Publish this note to community feed
        </label>
      </div>
    </main>
  )
}