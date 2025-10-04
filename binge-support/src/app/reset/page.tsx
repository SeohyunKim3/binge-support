'use client'

import { useState } from 'react'
import { supabase } from '../../lib/supabaseClient'

export default function ResetPasswordPage() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/update-password`,
    })
    if (error) setError(error.message)
    else setSent(true)
  }

  return (
    <main className="auth-page">
      <div className="auth-card">
        <h1 className="auth-title">Reset your password</h1>
        {!sent ? (
          <>
            <p className="auth-subtle">
              Enter your email and we’ll send you a reset link.
            </p>
            <form onSubmit={handleSubmit} className="auth-form">
              <input
                type="email"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              {error && <div className="auth-error">{error}</div>}
              <button type="submit" className="btn">Send reset link</button>
            </form>
          </>
        ) : (
          <>
            <p className="auth-subtle">
              If an account exists for <b>{email}</b>, you’ll get an email soon.
            </p>
            <button
              className="btn-ghost"
              onClick={() => setSent(false)}
            >
              Back
            </button>
          </>
        )}
      </div>
    </main>
  )
}