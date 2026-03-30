'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'

const ADMIN_EMAIL = 'shahkimit76@gmail.com'

function AdminSidebar({ active }: { active: string }) {
  const links = [
    { href: '/admin', label: 'Overview', icon: '⊞' },
    { href: '/admin/customers', label: 'Customers', icon: '👥' },
    { href: '/admin/orders', label: 'All Orders', icon: '📋' },
  ]
  return (
    <aside style={{ width: 240, background: '#111', height: '100vh', position: 'fixed', left: 0, top: 0, display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <div style={{ fontSize: 18, fontWeight: 800, color: '#fff' }}>Lumixly</div>
        <div style={{ fontSize: 11, color: '#6b7280', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px', marginTop: 2 }}>Admin</div>
      </div>
      <nav style={{ flex: 1, padding: '16px 12px' }}>
        {links.map(l => (
          <Link key={l.href} href={l.href} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', borderRadius: 8, marginBottom: 2, fontSize: 14, fontWeight: active === l.href ? 600 : 400, color: active === l.href ? '#fff' : 'rgba(255,255,255,0.5)', background: active === l.href ? 'rgba(255,255,255,0.08)' : 'transparent', textDecoration: 'none' }}>
            <span>{l.icon}</span> {l.label}
          </Link>
        ))}
      </nav>
      <div style={{ padding: '16px 24px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
        <Link href="/dashboard" style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', textDecoration: 'none' }}>← Customer view</Link>
      </div>
    </aside>
  )
}

export default function AdminCustomers() {
  const [customers, setCustomers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const router = useRouter()

  useEffect(() => {
    const sb = createClient()
    sb.auth.getUser().then(async ({ data }) => {
      if (!data.user || data.user.email !== ADMIN_EMAIL) { router.push('/dashboard'); return }
      const { data: c } = await sb.from('profiles').select('*').order('created_at', { ascending: false })
      setCustomers(c || [])
      setLoading(false)
    })
  }, [router])

  const filtered = customers.filter(c =>
    (c.full_name || '').toLowerCase().includes(search.toLowerCase())
  )

  const planColor = (plan: string) => plan === 'pro' ? { bg: '#ede9fe', color: '#7c3aed' } : plan === 'starter' ? { bg: '#dbeafe', color: '#2563eb' } : { bg: '#f3f4f6', color: '#6b7280' }

  return (
    <div style={{ fontFamily: "'Inter', sans-serif", background: '#f9fafb', minHeight: '100vh' }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap'); * { box-sizing: border-box; }`}</style>
      <AdminSidebar active="/admin/customers" />
      <main style={{ marginLeft: 240, padding: '40px 48px' }}>
        <div style={{ maxWidth: 1000 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32 }}>
            <div>
              <h1 style={{ fontSize: 24, fontWeight: 800, color: '#111', letterSpacing: '-0.5px' }}>Customers</h1>
              <p style={{ fontSize: 14, color: '#6b7280', marginTop: 4 }}>{customers.length} total accounts</p>
            </div>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search customers..." style={{ padding: '9px 14px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 14, outline: 'none', width: 220 }} />
          </div>

          <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e5e7eb' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f9fafb' }}>
                  {['Name', 'Plan', 'Images Used', 'Limit', 'Joined', 'Actions'].map(h => (
                    <th key={h} style={{ padding: '12px 20px', fontSize: 11, fontWeight: 600, color: '#6b7280', textAlign: 'left', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(c => {
                  const pc = planColor(c.plan)
                  return (
                    <tr key={c.id} style={{ borderTop: '1px solid #f3f4f6' }}>
                      <td style={{ padding: '16px 20px' }}>
                        <div style={{ fontSize: 14, fontWeight: 600, color: '#111' }}>{c.full_name || '—'}</div>
                        <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 2, fontFamily: 'monospace' }}>{c.id.slice(0, 12)}...</div>
                      </td>
                      <td style={{ padding: '16px 20px' }}>
                        <span style={{ padding: '3px 10px', borderRadius: 100, fontSize: 12, fontWeight: 700, background: pc.bg, color: pc.color, textTransform: 'uppercase', letterSpacing: '0.3px' }}>{c.plan || 'free'}</span>
                      </td>
                      <td style={{ padding: '16px 20px', fontSize: 14, color: '#374151', fontWeight: 500 }}>{c.credits_used || 0}</td>
                      <td style={{ padding: '16px 20px', fontSize: 14, color: '#374151' }}>{c.credits_limit || 10}</td>
                      <td style={{ padding: '16px 20px', fontSize: 13, color: '#6b7280' }}>{c.created_at ? new Date(c.created_at).toLocaleDateString() : '—'}</td>
                      <td style={{ padding: '16px 20px' }}>
                        <Link href={`/admin/customers/${c.id}`} style={{ fontSize: 13, color: '#2563eb', textDecoration: 'none', fontWeight: 500 }}>View →</Link>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
            {filtered.length === 0 && (
              <div style={{ padding: '48px', textAlign: 'center', color: '#9ca3af', fontSize: 14 }}>No customers found</div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
