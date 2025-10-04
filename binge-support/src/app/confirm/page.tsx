'use client'

import { useRouter } from 'next/navigation'

export default function ConfirmPage() {
  const router = useRouter()
  return (
    <main className="auth-page">
      <div className="auth-card">
        <h1 className="auth-title">Check your email ✉️</h1>
        <p className="auth-subtle">
          We’ve sent you a confirmation link.<br />
          Please verify your email to activate your account.
        </p>
        <button className="btn" onClick={() => router.push('/')}>
          Back to sign-in
        </button>
      </div>
    </main>
  )
}