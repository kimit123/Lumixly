'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'

function Sidebar({ active }: { active: string }) {
  const router = useRouter()
  const handleSignOut = async () => {
    const sb = createClient()
    await sb.auth.signOut()
    router.push('/')
  }
  const links = [
    { href: '/dashboard', label: 'Dashboard', icon: '⊞' },
    { href: '/upload', label: 'Upload Photos', icon: '↑' },
    { href: '/orders', label: 'My Orders', icon: '📋' },
    { href: '/billing', label: 'Billing', icon: '💳' },
  ]
  return (
    <aside style={{ width: 240, background: '#fff', borderRight: '1px solid #e5e7eb', height: '100vh', position: 'fixed', left: 0, top: 0, display: 'flex', flexDirection: 'column', zIndex: 10 }}>
      <div style={{ padding: '20px 24px', borderBottom: '1px solid #f3f4f6' }}>
        <Link href="/" style={{ fontSize: 18, fontWeight: 800, color: '#111', textDecoration: 'none', letterSpacing: '-0.5px' }}>Lumixly</Link>
      </div>
      <nav style={{ flex: 1, padding: '16px 12px' }}>
        {links.map(l => (
          <Link key={l.href} href={l.href} style={{
            display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', borderRadius: 8, marginBottom: 2,
            fontSize: 14, fontWeight: active === l.href ? 600 : 400,
            color: active === l.href ? '#2563eb' : '#6b7280',
            background: active === l.href ? '#eff6ff' : 'transparent',
            textDecoration: 'none', transition: 'all 0.15s',
          }}>
            <span style={{ fontSize: 16 }}>{l.icon}</span> {l.label}
          </Link>
        ))}
      </nav>
      <div style={{ padding: '16px 24px', borderTop: '1px solid #f3f4f6' }}>
        <button onClick={handleSignOut} style={{ fontSize: 13, color: '#9ca3af', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
          ← Sign out
        </button>
      </div>
    </aside>
  )
}

export default function DashboardPage() {
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [orders, setOrders] = useState<any[]>([])
  const router = useRouter()

  useEffect(() => {
    const sb = createClient()
    sb.auth.getUser().then(({ data }) => {
      if (!data.user) { router.push('/auth/login'); return }
      setUser(data.user)
      sb.from('profiles').select('*').eq('id', data.user.id).single().then(({ data: p }) => setProfile(p))
      sb.from('orders').select('*').eq('user_id', data.user.id).order('created_at', { ascending: false }).limit(5).then(({ data: o }) => setOrders(o || []))
    })
  }, [router])

  const pct = profile ? Math.min((profile.credits_used / profile.credits_limit) * 100, 100) : 0

  return (
    <div style={{ fontFamily: "'Inter', sans-serif", background: '#f9fafb', minHeight: '100vh' }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap'); * { box-sizing: border-box; }`}</style>
      <Sidebar active="/dashboard" />
      <main style={{ marginLeft: 240, padding: '40px 48px', minHeight: '100vh' }}>
        <div style={{ maxWidth: 960 }}>
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 36 }}>
            <div>
              <h1 style={{ fontSize: 24, fontWeight: 800, color: '#111', letterSpacing: '-0.5px' }}>Dashboard</h1>
              <p style={{ fontSize: 14, color: '#6b7280', marginTop: 4 }}>Welcome back{profile?.full_name ? `, ${profile.full_name}` : ''}!</p>
            </div>
            <Link href="/upload" style={{ background: '#2563eb', color: '#fff', padding: '10px 20px', borderRadius: 8, fontSize: 14, fontWeight: 600, textDecoration: 'none' }}>
              + Upload Photos
            </Link>
          </div>

          {/* Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20, marginBottom: 32 }}>
            {[
              { label: 'Images Used', value: profile?.credits_used || 0, sub: `of ${profile?.credits_limit || 10} this month`, color: '#2563eb' },
              { label: 'Total Orders', value: orders.length, sub: 'all time', color: '#7c3aed' },
              { label: 'Current Plan', value: profile?.plan ? profile.plan.charAt(0).toUpperCase() + profile.plan.slice(1) : 'Free', sub: <Link href="/billing" style={{ color: '#2563eb', textDecoration: 'none', fontSize: 12 }}>Upgrade →</Link>, color: '#059669' },
            ].map((s, i) => (
              <div key={i} style={{ background: '#fff', borderRadius: 12, padding: '24px', border: '1px solid #e5e7eb' }}>
                <div style={{ fontSize: 13, color: '#6b7280', fontWeight: 500, marginBottom: 8 }}>{s.label}</div>
                <div style={{ fontSize: 32, fontWeight: 800, color: s.color, letterSpacing: '-1px', lineHeight: 1 }}>{s.value}</div>
                <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 6 }}>{s.sub}</div>
              </div>
            ))}
          </div>

          {/* Usage bar */}
          <div style={{ background: '#fff', borderRadius: 12, padding: 24, border: '1px solid #e5e7eb', marginBottom: 32 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
              <span style={{ fontSize: 14, fontWeight: 600, color: '#111' }}>Monthly usage</span>
              <span style={{ fontSize: 13, color: '#6b7280' }}>{profile?.credits_used || 0} / {profile?.credits_limit || 10} images</span>
            </div>
            <div style={{ background: '#f3f4f6', borderRadius: 100, height: 8 }}>
              <div style={{ background: pct > 80 ? '#ef4444' : '#2563eb', height: 8, borderRadius: 100, width: `${pct}%`, transition: 'width 0.5s' }} />
            </div>
            {pct > 80 && <p style={{ fontSize: 12, color: '#ef4444', marginTop: 8 }}>Running low — <Link href="/billing" style={{ color: '#ef4444', fontWeight: 600 }}>upgrade your plan</Link></p>}
          </div>

          {/* Recent orders */}
          <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e5e7eb' }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid #f3f4f6', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontSize: 16, fontWeight: 700, color: '#111' }}>Recent Orders</h2>
              <Link href="/orders" style={{ fontSize: 13, color: '#2563eb', textDecoration: 'none', fontWeight: 500 }}>View all →</Link>
            </div>
            {orders.length === 0 ? (
              <div style={{ padding: '60px 24px', textAlign: 'center' }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>📂</div>
                <p style={{ fontSize: 15, color: '#6b7280', marginBottom: 16 }}>No orders yet. Upload your first batch!</p>
                <Link href="/upload" style={{ background: '#2563eb', color: '#fff', padding: '10px 22px', borderRadius: 8, fontSize: 14, fontWeight: 600, textDecoration: 'none' }}>Upload Photos →</Link>
              </div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#f9fafb' }}>
                    {['Order', 'Type', 'Images', 'Status', 'Date', ''].map(h => (
                      <th key={h} style={{ padding: '10px 16px', fontSize: 12, fontWeight: 600, color: '#6b7280', textAlign: 'left', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {orders.map(o => (
                    <tr key={o.id} style={{ borderTop: '1px solid #f3f4f6' }}>
                      <td style={{ padding: '14px 16px', fontSize: 13, color: '#6b7280', fontFamily: 'monospace' }}>#{o.id.slice(0, 8)}</td>
                      <td style={{ padding: '14px 16px', fontSize: 13, color: '#111', fontWeight: 500, textTransform: 'capitalize' }}>{o.crop_type?.replace('_', ' ')}</td>
                      <td style={{ padding: '14px 16px', fontSize: 13, color: '#374151' }}>{o.image_count}</td>
                      <td style={{ padding: '14px 16px' }}>
                        <span style={{ padding: '3px 10px', borderRadius: 100, fontSize: 12, fontWeight: 600, background: o.status === 'done' ? '#dcfce7' : o.status === 'error' ? '#fee2e2' : '#fef9c3', color: o.status === 'done' ? '#16a34a' : o.status === 'error' ? '#dc2626' : '#92400e' }}>
                          {o.status}
                        </span>
                      </td>
                      <td style={{ padding: '14px 16px', fontSize: 13, color: '#6b7280' }}>{new Date(o.created_at).toLocaleDateString()}</td>
                      <td style={{ padding: '14px 16px' }}>
                        {o.status === 'done' && <Link href={`/orders/${o.id}`} style={{ fontSize: 13, color: '#2563eb', textDecoration: 'none', fontWeight: 500 }}>Download</Link>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
