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

export default function AdminOrders() {
  const [orders, setOrders] = useState<any[]>([])
  const [filter, setFilter] = useState('all')
  const router = useRouter()

  useEffect(() => {
    const sb = createClient()
    sb.auth.getUser().then(async ({ data }) => {
      if (!data.user || data.user.email !== ADMIN_EMAIL) { router.push('/dashboard'); return }
      const { data: o } = await sb.from('orders').select('*, profiles(full_name)').order('created_at', { ascending: false }).limit(100)
      setOrders(o || [])
    })
  }, [router])

  const filtered = filter === 'all' ? orders : orders.filter(o => o.status === filter)

  return (
    <div style={{ fontFamily: "'Inter', sans-serif", background: '#f9fafb', minHeight: '100vh' }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap'); * { box-sizing: border-box; }`}</style>
      <AdminSidebar active="/admin/orders" />
      <main style={{ marginLeft: 240, padding: '40px 48px' }}>
        <div style={{ maxWidth: 1000 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
            <div>
              <h1 style={{ fontSize: 24, fontWeight: 800, color: '#111', letterSpacing: '-0.5px' }}>All Orders</h1>
              <p style={{ fontSize: 14, color: '#6b7280', marginTop: 4 }}>{orders.length} total</p>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              {['all', 'pending', 'processing', 'done', 'error'].map(s => (
                <button key={s} onClick={() => setFilter(s)} style={{ padding: '7px 14px', borderRadius: 8, border: '1.5px solid', borderColor: filter === s ? '#2563eb' : '#d1d5db', background: filter === s ? '#eff6ff' : '#fff', color: filter === s ? '#2563eb' : '#6b7280', fontSize: 13, fontWeight: 600, cursor: 'pointer', textTransform: 'capitalize' }}>{s}</button>
              ))}
            </div>
          </div>
          <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e5e7eb' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f9fafb' }}>
                  {['Order', 'Customer', 'Type', 'Images', 'Status', 'Date', ''].map(h => (
                    <th key={h} style={{ padding: '12px 16px', fontSize: 11, fontWeight: 600, color: '#6b7280', textAlign: 'left', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(o => (
                  <tr key={o.id} style={{ borderTop: '1px solid #f3f4f6' }}>
                    <td style={{ padding: '14px 16px', fontSize: 12, color: '#6b7280', fontFamily: 'monospace' }}>#{o.id.slice(0, 8)}</td>
                    <td style={{ padding: '14px 16px', fontSize: 13, color: '#111', fontWeight: 500 }}>{(o.profiles as any)?.full_name || '—'}</td>
                    <td style={{ padding: '14px 16px', fontSize: 13, color: '#374151', textTransform: 'capitalize' }}>{o.crop_type?.replace('_', ' ')}</td>
                    <td style={{ padding: '14px 16px', fontSize: 13 }}>{o.image_count}</td>
                    <td style={{ padding: '14px 16px' }}>
                      <span style={{ padding: '3px 10px', borderRadius: 100, fontSize: 11, fontWeight: 600, background: o.status === 'done' ? '#dcfce7' : o.status === 'error' ? '#fee2e2' : '#fef9c3', color: o.status === 'done' ? '#16a34a' : o.status === 'error' ? '#dc2626' : '#92400e' }}>{o.status}</span>
                    </td>
                    <td style={{ padding: '14px 16px', fontSize: 13, color: '#6b7280' }}>{new Date(o.created_at).toLocaleDateString()}</td>
                    <td style={{ padding: '14px 16px' }}>
                      <Link href={`/orders/${o.id}`} style={{ fontSize: 13, color: '#2563eb', textDecoration: 'none', fontWeight: 500 }}>View</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  )
}
