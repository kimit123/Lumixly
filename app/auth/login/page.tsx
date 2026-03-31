'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true); setError('')
    const sb = createClient()
    const { error } = await sb.auth.signInWithPassword({ email, password })
    if (error) { setError(error.message); setLoading(false); return }
    // Check role and redirect
    const { data: { user } } = await sb.auth.getUser()
    if (user) {
      const { data: profile } = await sb.from('profiles').select('role').eq('id', user.id).single()
      if (profile?.role === 'admin') router.push('/admin')
      else if (profile?.role === 'team') router.push('/team')
      else router.push('/dashboard')
    }
  }

  return (
    <div style={{ fontFamily: "'Inter',sans-serif", minHeight: '100vh', background: '#f9fafb', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap'); *{box-sizing:border-box;} input:focus{outline:none;border-color:#2563eb!important;box-shadow:0 0 0 3px rgba(37,99,235,0.1);}`}</style>
      <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #e5e7eb', padding: '48px 40px', width: '100%', maxWidth: 400 }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <Link href="/" style={{ fontSize: 22, fontWeight: 800, color: '#111', textDecoration: 'none', letterSpacing: '-0.5px' }}>Lumixly</Link>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: '#111', marginTop: 16, marginBottom: 6 }}>Welcome back</h1>
          <p style={{ fontSize: 14, color: '#6b7280' }}>Sign in to your account</p>
        </div>
        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="you@example.com" style={{ width: '100%', padding: '10px 14px', border: '1.5px solid #d1d5db', borderRadius: 8, fontSize: 14, transition: 'all 0.15s' }} />
          </div>
          <div>
            <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>Password</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} required style={{ width: '100%', padding: '10px 14px', border: '1.5px solid #d1d5db', borderRadius: 8, fontSize: 14 }} />
          </div>
          {error && <div style={{ background: '#fee2e2', border: '1px solid #fca5a5', borderRadius: 8, padding: '10px 14px', color: '#dc2626', fontSize: 13 }}>{error}</div>}
          <button type="submit" disabled={loading} style={{ background: loading ? '#93c5fd' : '#2563eb', color: '#fff', padding: '12px', borderRadius: 8, fontSize: 15, fontWeight: 700, border: 'none', cursor: loading ? 'not-allowed' : 'pointer', marginTop: 4 }}>
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>
        <p style={{ textAlign: 'center', fontSize: 14, color: '#6b7280', marginTop: 24 }}>
          No account? <Link href="/auth/signup" style={{ color: '#2563eb', fontWeight: 600, textDecoration: 'none' }}>Sign up free</Link>
        </p>
      </div>
    </div>
  )
}
