'use client'

import { useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSignUp, setIsSignUp] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setErrorMsg(null)

    if (isSignUp) {
      const { error } = await supabase.auth.signUp({ email, password })
      if (error) setErrorMsg(error.message)
      else alert('이메일로 인증 확인 절차가 전송되었어요!')
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) setErrorMsg(error.message)
      else router.push('/dashboard')
    }
    setLoading(false)
  }

  return (
    <main className="auth-page">
      <div className="auth-card">
        <h1 className="auth-title">{isSignUp ? '기록장 만들기' : '오늘도 오셨군요!'}</h1>
        <p className="auth-subtle">
          {isSignUp
            ? '뭐든 빨리 만들고 기록해보세요'
            : '로그인하고 기록장 입장하기'}
        </p>

        <form onSubmit={handleSubmit} className="auth-form">
          <input
            type="email"
            placeholder="이메일 주소"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="비밀번호"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />


          {errorMsg && <div className="auth-error">{errorMsg}</div>}

          <button type="submit" className="btn" disabled={loading}>
            {loading ? 'Please wait…' : isSignUp ? '싸인 업' : '싸인 인'}
          </button>
        </form>

        <p className="auth-toggle">
          {isSignUp ? '기록장이 이미 있으신가요?' : "기록장이 없으신가요?"}{' '}
          <button
            type="button"
            className="link"
            onClick={() => setIsSignUp(!isSignUp)}
          >
            {isSignUp ? '싸인 인' : '싸인 업'}
          </button>
        </p>
        <p style={{ textAlign: 'right', marginTop: '-4px' }}>
  <a href="/reset" className="link">비밀번호를 잊으셨나요??</a>
</p>
      </div>
    </main>
  )
}