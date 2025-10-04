'use client'

import { useState } from 'react'
import { supabase } from '../../lib/supabaseClient'
import { useRouter } from 'next/navigation'

export default function UpdatePasswordPage() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (password !== confirm) {
      setError('Passwords do not match')
      return
    }
    setLoading(true)
    const { error } = await supabase.auth.updateUser({ password })
    setLoading(false)
    if (error) setError(error.message)
    else setDone(true)
  }

  return (
    <main className="auth-page">
      <div className="auth-card">
        <h1 className="auth-title">Set a new password</h1>
        {!done ? (
          <form onSubmit={handleUpdate} className="auth-form">
            <input
              type="password"
              placeholder="New password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <input
              type="password"
              placeholder="Confirm password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
            />
            {error && <div className="auth-error">{error}</div>}
            <button type="submit" className="btn" disabled={loading}>
              {loading ? 'Updating…' : 'Update password'}
            </button>
          </form>
        ) : (
          <>
            <p className="auth-subtle">
              Your password has been changed successfully.
            </p>
            <button
              className="btn"
              onClick={() => router.push('/')}
            >
              Back to sign-in
            </button>
          </>
        )}
      </div>
    </main>
  )
}