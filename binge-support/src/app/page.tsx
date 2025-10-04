'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../lib/supabaseClient' // ← adjust if yours is at src/lib

export default function Home() {
  const router = useRouter()

  // form state
  const [mode, setMode] = useState<'signin' | 'signup'>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [err, setErr] = useState<string | null>(null)

  // keep UI in sync with auth
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setUserEmail(data.session?.user?.email ?? null)
    })
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setUserEmail(session?.user?.email ?? null)
    })
    return () => sub.subscription.unsubscribe()
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErr(null)
    if (!email || !password) return setErr('Email and password are required.')
    setLoading(true)

    try {
      if (mode === 'signup') {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: 'http://localhost:3000' },
        })
        if (error) throw error
        // By default, email confirmation may be required.
        // After confirming via the email link, the user can sign in.
        alert('Account created. Check your email to confirm your address.')
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        })
        if (error) throw error
        router.push('/dashboard')
      }
    } catch (e: any) {
      console.error(e)
      setErr(e?.message ?? 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  async function signOut() {
    await supabase.auth.signOut()
  }

  return (
    <main style={{ maxWidth: 720, margin: '60px auto', fontFamily: 'system-ui' }}>
      <h1>Binge Support (MVP)</h1>
      <p style={{ color: '#666', marginTop: 8 }}>
        Private space to log triggers & feelings. This app is not a substitute for professional care.
      </p>

      {!userEmail ? (
        <section style={{ marginTop: 24 }}>
          <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
            <button
              onClick={() => setMode('signin')}
              style={{ padding: '6px 10px', background: mode === 'signin' ? '#000' : '#eee', color: mode === 'signin' ? '#fff' : '#000' }}
            >
              Sign in
            </button>
            <button
              onClick={() => setMode('signup')}
              style={{ padding: '6px 10px', background: mode === 'signup' ? '#000' : '#eee', color: mode === 'signup' ? '#fff' : '#000' }}
            >
              Sign up
            </button>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 10, maxWidth: 380 }}>
            <input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
              style={{ padding: 10 }}
            />
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                type={showPw ? 'text' : 'password'}
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
                required
                style={{ padding: 10, flex: 1 }}
              />
              <button type="button" onClick={() => setShowPw((v) => !v)} style={{ padding: '0 10px' }}>
                {showPw ? 'Hide' : 'Show'}
              </button>
            </div>

            {err && <div style={{ color: 'crimson' }}>{err}</div>}

            <button disabled={loading} type="submit" style={{ padding: 10 }}>
              {loading ? (mode === 'signup' ? 'Creating…' : 'Signing in…') : mode === 'signup' ? 'Create account' : 'Sign in'}
            </button>
          </form>
        </section>
      ) : (
        <section style={{ marginTop: 24 }}>
          <p>Signed in as <b>{userEmail}</b></p>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => router.push('/dashboard')}>Go to my journal</button>
            <button onClick={signOut}>Sign out</button>
          </div>
        </section>
      )}

      <hr style={{ margin: '32px 0' }} />
      <h4>Immediate help</h4>
      <p>If you feel you might hurt yourself or others, please contact emergency services immediately.</p>
    </main>
  )
}