'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'

function Sidebar({ active }: { active: string }) {
  const links = [
    { href: '/dashboard', label: 'Dashboard', icon: '⊞' },
    { href: '/upload', label: 'Upload Photos', icon: '↑' },
    { href: '/orders', label: 'My Orders', icon: '📋' },
    { href: '/billing', label: 'Billing', icon: '💳' },
  ]
  return (
    <aside style={{ width: 240, background: '#fff', borderRight: '1px solid #e5e7eb', height: '100vh', position: 'fixed', left: 0, top: 0, display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '20px 24px', borderBottom: '1px solid #f3f4f6' }}>
        <Link href="/" style={{ fontSize: 18, fontWeight: 800, color: '#111', textDecoration: 'none' }}>Lumixly</Link>
      </div>
      <nav style={{ flex: 1, padding: '16px 12px' }}>
        {links.map(l => (
          <Link key={l.href} href={l.href} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', borderRadius: 8, marginBottom: 2, fontSize: 14, fontWeight: active === l.href ? 600 : 400, color: active === l.href ? '#2563eb' : '#6b7280', background: active === l.href ? '#eff6ff' : 'transparent', textDecoration: 'none' }}>
            <span style={{ fontSize: 16 }}>{l.icon}</span> {l.label}
          </Link>
        ))}
      </nav>
    </aside>
  )
}

const PLANS = [
  { id: 'starter', name: 'Starter', price: 19, images: 100, per: '£0.40', features: ['100 images/month', 'All crop types', 'Both output sizes', 'Email support'] },
  { id: 'pro', name: 'Pro', price: 49, images: 500, per: '£0.25', features: ['500 images/month', 'Priority processing', 'Bulk 1,000 upload', 'Priority support'], popular: true },
]

export default function BillingPage() {
  const [profile, setProfile] = useState<any>(null)
  const router = useRouter()

  useEffect(() => {
    const sb = createClient()
    sb.auth.getUser().then(({ data }) => {
      if (!data.user) { router.push('/auth/login'); return }
      sb.from('profiles').select('*').eq('id', data.user.id).single().then(({ data: p }) => setProfile(p))
    })
  }, [router])

  return (
    <div style={{ fontFamily: "'Inter', sans-serif", background: '#f9fafb', minHeight: '100vh' }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap'); * { box-sizing: border-box; }`}</style>
      <Sidebar active="/billing" />
      <main style={{ marginLeft: 240, padding: '40px 48px' }}>
        <div style={{ maxWidth: 860 }}>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: '#111', letterSpacing: '-0.5px', marginBottom: 6 }}>Billing</h1>
          <p style={{ fontSize: 14, color: '#6b7280', marginBottom: 36 }}>
            Current plan: <strong style={{ color: '#2563eb', textTransform: 'capitalize' }}>{profile?.plan || 'Free'}</strong> &nbsp;•&nbsp; {profile?.credits_used || 0}/{profile?.credits_limit || 10} images used this month
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 32 }}>
            {PLANS.map(p => {
              const isCurrent = profile?.plan === p.id
              return (
                <div key={p.id} style={{ background: '#fff', borderRadius: 16, border: `2px solid ${p.popular ? '#2563eb' : '#e5e7eb'}`, padding: 32, position: 'relative' }}>
                  {p.popular && <div style={{ position: 'absolute', top: -12, left: 24, background: '#2563eb', color: '#fff', fontSize: 11, fontWeight: 700, padding: '3px 14px', borderRadius: 100 }}>MOST POPULAR</div>}
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8 }}>{p.name}</div>
                  <div style={{ fontSize: 42, fontWeight: 800, color: '#111', letterSpacing: '-1.5px', lineHeight: 1 }}>£{p.price}<span style={{ fontSize: 15, fontWeight: 500, color: '#9ca3af' }}>/mo</span></div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#2563eb', margin: '16px 0 4px' }}>{p.images} images/month</div>
                  <div style={{ fontSize: 13, color: '#9ca3af', marginBottom: 20 }}>{p.per} per extra image</div>
                  <ul style={{ listStyle: 'none', padding: 0, marginBottom: 24 }}>
                    {p.features.map(f => (
                      <li key={f} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, color: '#374151', marginBottom: 8 }}>
                        <span style={{ width: 18, height: 18, background: '#dcfce7', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, color: '#16a34a', fontWeight: 700, flexShrink: 0 }}>✓</span>
                        {f}
                      </li>
                    ))}
                  </ul>
                  {isCurrent ? (
                    <div style={{ textAlign: 'center', padding: '12px', borderRadius: 8, border: '2px solid #2563eb', color: '#2563eb', fontSize: 14, fontWeight: 700 }}>✓ Current Plan</div>
                  ) : (
                    <a href={`/api/stripe?plan=${p.id}`} style={{ display: 'block', textAlign: 'center', padding: '12px', borderRadius: 8, background: p.popular ? '#2563eb' : '#111', color: '#fff', fontSize: 14, fontWeight: 700, textDecoration: 'none' }}>
                      Upgrade to {p.name}
                    </a>
                  )}
                </div>
              )
            })}
          </div>

          {profile?.stripe_subscription_id && (
            <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e5e7eb', padding: 24 }}>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: '#111', marginBottom: 8 }}>Manage Subscription</h3>
              <p style={{ fontSize: 14, color: '#6b7280', marginBottom: 16 }}>Update payment method, view invoices, or cancel your subscription.</p>
              <a href="/api/stripe/portal" style={{ fontSize: 14, color: '#2563eb', fontWeight: 600, textDecoration: 'none' }}>Open billing portal →</a>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
