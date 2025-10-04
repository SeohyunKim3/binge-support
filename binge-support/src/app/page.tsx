'use client'

import React, { useEffect, useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../lib/supabaseClient' // adjust if your path differs

type Entry = {
  id: string
  user_id: string
  content: string
  created_at: string
  is_public: boolean
  profiles?: { username?: string | null } | null
}

export default function Home() {
  const router = useRouter()

  // auth
  const [session, setSession] = useState<any>(null)
  const [authLoading, setAuthLoading] = useState(true)

  // form
  const [mode, setMode] = useState<'signin' | 'signup'>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [working, setWorking] = useState(false)

  // feed
  const [feedLoading, setFeedLoading] = useState(false)
  const [entries, setEntries] = useState<Entry[]>([])

  // bootstrap session + subscribe to changes
  useEffect(() => {
    let mounted = true

    const bootstrap = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!mounted) return
      setSession(session)
      setAuthLoading(false)
      if (session) loadFeed()
    }
    bootstrap()

    const { data: sub } = supabase.auth.onAuthStateChange((_evt, sess) => {
      setSession(sess)
      if (sess) loadFeed()
      else setEntries([])
    })

    return () => {
      mounted = false
      sub.subscription.unsubscribe()
    }
  }, [])

  async function loadFeed() {
    setFeedLoading(true)
    const { data, error } = await supabase
      .from('entries')
      .select(`
        id,
        user_id,
        content,
        created_at,
        is_public,
        profiles ( username )
      `)
      .eq('is_public', true)
      .order('created_at', { ascending: false })
      .limit(50)

    if (!error && data) setEntries(data as Entry[])
    setFeedLoading(false)
  }

  async function onAuth(e: FormEvent) {
    e.preventDefault()
    if (!email || !password) return
    setWorking(true)

    if (mode === 'signup') {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo:
            typeof window !== 'undefined'
              ? `${window.location.origin}`
              : undefined,
        },
      })
      setWorking(false)
      if (error) return alert(error.message)

      // optional: create profile row on sign up
      const uid = data.user?.id
      if (uid) {
        await supabase.from('profiles').insert({
          id: uid,
          username: email.split('@')[0],
        })
      }
      alert('Check your email to confirm your account, then sign in.')
      setMode('signin')
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      setWorking(false)
      if (error) return alert(error.message)
      setEmail('')
      setPassword('')
      // session listener will load feed
    }
  }

  async function resetPassword() {
    if (!email) return alert('Enter your email first.')
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo:
        typeof window !== 'undefined'
          ? `${window.location.origin}/reset`
          : undefined,
    })
    if (error) alert(error.message)
    else alert('Password reset link sent. Check your email.')
  }

  async function signOut() {
    await supabase.auth.signOut()
  }

  if (authLoading) {
    return <main style={{ maxWidth: 720, margin: '40px auto' }}>Loading…</main>
  }

  // ---------- Not signed in: show auth form ----------
  if (!session) {
    return (
      <main style={{ maxWidth: 720, margin: '40px auto', fontFamily: 'system-ui' }}>
        <h1>Binge Support (MVP)</h1>
        <p>Private space to log triggers & feelings. This app is not a substitute for professional care.</p>

        <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
          <button
            onClick={() => setMode('signin')}
            style={{ fontWeight: mode === 'signin' ? 700 : 400 }}
          >
            Sign in
          </button>
          <button
            onClick={() => setMode('signup')}
            style={{ fontWeight: mode === 'signup' ? 700 : 400 }}
          >
            Sign up
          </button>
        </div>

        <form onSubmit={onAuth} style={{ display: 'grid', gap: 8, marginTop: 12, maxWidth: 420 }}>
          <input
            type="email"
            placeholder="you@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={{ padding: 8 }}
          />
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              type="password"
              placeholder={mode === 'signup' ? 'Create a password (min 6 chars)' : 'Password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{ padding: 8, flex: 1 }}
            />
            <button type="button" onClick={resetPassword}>Forgot?</button>
          </div>

          <button disabled={working}>{working ? 'Working…' : (mode === 'signup' ? 'Create account' : 'Sign in')}</button>
        </form>

        <hr style={{ margin: '32px 0' }} />
        <h3>Immediate help</h3>
        <p>If you feel you might hurt yourself or others, please contact emergency services immediately.</p>
      </main>
    )
  }

  // ---------- Signed in: show actions + feed ----------
  return (
    <main style={{ maxWidth: 720, margin: '40px auto', fontFamily: 'system-ui' }}>
      <h1>Binge Support (MVP)</h1>
      <p>Private space to log triggers & feelings. This app is not a substitute for professional care.</p>

      <p>Signed in as <strong>{session.user.email}</strong></p>
      <div style={{ display: 'flex', gap: 8 }}>
        <button onClick={() => router.push('/dashboard')}>Go to my journal</button>
        <button onClick={signOut}>Sign out</button>
      </div>

      <hr style={{ margin: '32px 0' }} />

      <h2>Community feed</h2>
      <p style={{ color: '#666' }}>Published journals from the community:</p>

      {feedLoading ? (
        <p>Loading…</p>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {entries.map((it) => (
            <li key={it.id} style={{ padding: '12px 0', borderBottom: '1px solid #eee' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <strong>{(it.profiles?.username && it.profiles.username.trim()) || 'Anonymous'}</strong>
                <small>{new Date(it.created_at).toLocaleString()}</small>
              </div>
              <p style={{ margin: '6px 0 0' }}>{it.content}</p>
            </li>
          ))}
          {!entries.length && <li>No public entries yet.</li>}
        </ul>
      )}

      <hr style={{ margin: '32px 0' }} />
      <h3>Immediate help</h3>
      <p>If you feel you might hurt yourself or others, please contact emergency services immediately.</p>
    </main>
  )
}