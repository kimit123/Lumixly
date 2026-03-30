'use client'
import { useState, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase'

function SignupForm() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const searchParams = useSearchParams()
  const plan = searchParams.get('plan') || 'free'

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true); setError('')
    const sb = createClient()
    const { error } = await sb.auth.signUp({
      email, password,
      options: { data: { full_name: name, plan }, emailRedirectTo: `${location.origin}/auth/callback` }
    })
    if (error) { setError(error.message); setLoading(false); return }
    if (plan !== 'free') {
      window.location.href = `/api/stripe?plan=${plan}`
    } else {
      router.push('/dashboard')
    }
  }

  return (
    <div style={{ fontFamily: "'Inter', sans-serif", minHeight: '100vh', background: '#f9fafb', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap'); * { box-sizing: border-box; } input:focus { outline: none; border-color: #2563eb !important; box-shadow: 0 0 0 3px rgba(37,99,235,0.1); }`}</style>
      <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #e5e7eb', padding: '48px 40px', width: '100%', maxWidth: 420 }}>
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <Link href="/" style={{ fontSize: 22, fontWeight: 800, color: '#111', textDecoration: 'none', letterSpacing: '-0.5px' }}>Lumixly</Link>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: '#111', marginTop: 16, marginBottom: 6, letterSpacing: '-0.3px' }}>Create your account</h1>
          <p style={{ fontSize: 14, color: '#6b7280' }}>Start with 10 free images</p>
        </div>
        {plan !== 'free' && (
          <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#2563eb', fontWeight: 500, marginBottom: 20, textAlign: 'center' }}>
            You're signing up for the <strong style={{ textTransform: 'capitalize' }}>{plan}</strong> plan
          </div>
        )}
        <form onSubmit={handleSignup} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>Full name</label>
            <input type="text" value={name} onChange={e => setName(e.target.value)} required placeholder="Your name" style={{ width: '100%', padding: '10px 14px', border: '1.5px solid #d1d5db', borderRadius: 8, fontSize: 14 }} />
          </div>
          <div>
            <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="you@example.com" style={{ width: '100%', padding: '10px 14px', border: '1.5px solid #d1d5db', borderRadius: 8, fontSize: 14 }} />
          </div>
          <div>
            <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>Password</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} required minLength={6} placeholder="Min. 6 characters" style={{ width: '100%', padding: '10px 14px', border: '1.5px solid #d1d5db', borderRadius: 8, fontSize: 14 }} />
          </div>
          {error && <div style={{ background: '#fee2e2', border: '1px solid #fca5a5', borderRadius: 8, padding: '10px 14px', color: '#dc2626', fontSize: 13 }}>{error}</div>}
          <button type="submit" disabled={loading} style={{ background: loading ? '#93c5fd' : '#2563eb', color: '#fff', padding: '12px', borderRadius: 8, fontSize: 15, fontWeight: 700, border: 'none', cursor: loading ? 'not-allowed' : 'pointer', marginTop: 4 }}>
            {loading ? 'Creating account...' : plan !== 'free' ? `Continue to payment →` : 'Create account'}
          </button>
        </form>
        <p style={{ textAlign: 'center', fontSize: 14, color: '#6b7280', marginTop: 24 }}>
          Already have an account? <Link href="/auth/login" style={{ color: '#2563eb', fontWeight: 600, textDecoration: 'none' }}>Sign in</Link>
        </p>
      </div>
    </div>
  )
}

export default function SignupPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Inter, sans-serif', color: '#6b7280' }}>Loading...</div>}>
      <SignupForm />
    </Suspense>
  )
}
