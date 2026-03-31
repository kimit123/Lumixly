'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Sidebar from '@/components/Sidebar'
import { createClient } from '@/lib/supabase'

const STATUS_CONFIG: Record<string, { label: string; bg: string; color: string; icon: string }> = {
  pending:            { label: 'Pending',         bg: '#f3f4f6', color: '#6b7280', icon: '◷' },
  in_progress:        { label: 'In Progress',     bg: '#fef9c3', color: '#92400e', icon: '⟳' },
  ready_for_review:   { label: 'Ready for Review', bg: '#dbeafe', color: '#1d4ed8', icon: '👁' },
  revision_requested: { label: 'Revision',        bg: '#fce7f3', color: '#be185d', icon: '↩' },
  completed:          { label: 'Completed',       bg: '#dcfce7', color: '#16a34a', icon: '✓' },
}

export default function AdminDashboard() {
  const [profile, setProfile] = useState<any>(null)
  const [orders, setOrders] = useState<any[]>([])
  const [stats, setStats] = useState({ pending: 0, inProgress: 0, readyReview: 0, completed: 0, customers: 0 })
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const sb = createClient()
    sb.auth.getUser().then(async ({ data }) => {
      if (!data.user) { router.push('/auth/login'); return }
      const profileRes = await sb.from('profiles').select('*').eq('id', data.user.id).single()
      if (profileRes.data?.role !== 'admin') { router.push('/dashboard'); return }
      setProfile(profileRes.data)

      const [ordersRes, customersRes] = await Promise.all([
        sb.from('orders').select('*, profiles!customer_id(full_name, email)').order('created_at', { ascending: false }).limit(20),
        sb.from('profiles').select('id', { count: 'exact' }).eq('role', 'customer'),
      ])

      const o = ordersRes.data || []
      setOrders(o)
      setStats({
        pending: o.filter(x => x.status === 'pending').length,
        inProgress: o.filter(x => x.status === 'in_progress').length,
        readyReview: o.filter(x => x.status === 'ready_for_review').length,
        completed: o.filter(x => x.status === 'completed').length,
        customers: customersRes.count || 0,
      })
      setLoading(false)
    })
  }, [router])

  if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', fontFamily: 'Inter, sans-serif', color: '#6b7280' }}>Loading...</div>

  return (
    <div style={{ fontFamily: "'Inter', sans-serif", background: '#f9fafb', minHeight: '100vh' }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap'); * { box-sizing: border-box; }`}</style>
      <Sidebar role="admin" active="/admin" userName={profile?.full_name} />
      <main style={{ marginLeft: 240, padding: '40px 48px' }}>
        <div style={{ maxWidth: 1060 }}>
          <div style={{ marginBottom: 32 }}>
            <h1 style={{ fontSize: 24, fontWeight: 800, color: '#111', letterSpacing: '-0.5px' }}>Admin Overview</h1>
            <p style={{ fontSize: 14, color: '#6b7280', marginTop: 4 }}>Manage orders, customers and team</p>
          </div>

          {/* Alert: pending orders */}
          {stats.pending > 0 && (
            <div style={{ background: '#fef9c3', border: '1px solid #fde68a', borderRadius: 10, padding: '14px 18px', marginBottom: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 20 }}>📬</span>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#92400e' }}>{stats.pending} new order{stats.pending > 1 ? 's' : ''} waiting</div>
                  <div style={{ fontSize: 13, color: '#b45309' }}>Download photos and start processing</div>
                </div>
              </div>
              <Link href="/admin/orders?filter=pending" style={{ background: '#f59e0b', color: '#fff', padding: '8px 16px', borderRadius: 7, fontSize: 13, fontWeight: 600, textDecoration: 'none' }}>View Orders →</Link>
            </div>
          )}

          {/* Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 16, marginBottom: 32 }}>
            {[
              { label: 'Pending', value: stats.pending, color: '#6b7280', bg: '#f3f4f6' },
              { label: 'In Progress', value: stats.inProgress, color: '#92400e', bg: '#fef9c3' },
              { label: 'Awaiting Review', value: stats.readyReview, color: '#1d4ed8', bg: '#dbeafe' },
              { label: 'Completed', value: stats.completed, color: '#16a34a', bg: '#dcfce7' },
              { label: 'Customers', value: stats.customers, color: '#7c3aed', bg: '#ede9fe' },
            ].map(s => (
              <div key={s.label} style={{ background: '#fff', borderRadius: 12, padding: '18px 20px', border: '1px solid #e5e7eb' }}>
                <div style={{ fontSize: 12, color: '#6b7280', fontWeight: 500, marginBottom: 8 }}>{s.label}</div>
                <div style={{ fontSize: 30, fontWeight: 800, color: s.color, letterSpacing: '-1px', lineHeight: 1 }}>{s.value}</div>
              </div>
            ))}
          </div>

          {/* Quick actions */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 32 }}>
            {[
              { href: '/admin/orders?filter=pending', icon: '📥', label: 'Download Customer Photos', desc: 'Get originals to process', color: '#f59e0b' },
              { href: '/admin/upload', icon: '📤', label: 'Upload Completed Photos', desc: 'Send processed photos back', color: '#2563eb' },
              { href: '/admin/customers', icon: '👥', label: 'Manage Customers', desc: 'View accounts and orders', color: '#7c3aed' },
            ].map(a => (
              <Link key={a.href} href={a.href} style={{ background: '#fff', borderRadius: 12, border: '1px solid #e5e7eb', padding: '20px', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 14, transition: 'box-shadow 0.15s' }}>
                <div style={{ width: 44, height: 44, borderRadius: 10, background: a.color + '18', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}>{a.icon}</div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#111' }}>{a.label}</div>
                  <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>{a.desc}</div>
                </div>
              </Link>
            ))}
          </div>

          {/* Recent orders table */}
          <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e5e7eb' }}>
            <div style={{ padding: '18px 24px', borderBottom: '1px solid #f3f4f6', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontSize: 15, fontWeight: 700, color: '#111' }}>All Orders</h2>
              <Link href="/admin/orders" style={{ fontSize: 13, color: '#2563eb', textDecoration: 'none', fontWeight: 500 }}>View all →</Link>
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f9fafb' }}>
                  {['Order', 'Customer', 'Service', 'Photos', 'Status', 'Date', ''].map(h => (
                    <th key={h} style={{ padding: '10px 16px', fontSize: 11, fontWeight: 600, color: '#6b7280', textAlign: 'left', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {orders.map(o => {
                  const sc = STATUS_CONFIG[o.status] || STATUS_CONFIG.pending
                  const customer = o.profiles as any
                  return (
                    <tr key={o.id} style={{ borderTop: '1px solid #f3f4f6' }}>
                      <td style={{ padding: '13px 16px', fontSize: 12, color: '#9ca3af', fontFamily: 'monospace' }}>#{o.id.slice(0, 8)}</td>
                      <td style={{ padding: '13px 16px', fontSize: 13, color: '#111', fontWeight: 500 }}>{customer?.full_name || '—'}</td>
                      <td style={{ padding: '13px 16px', fontSize: 13, color: '#374151', textTransform: 'capitalize' }}>{o.service_type?.replace(/_/g, ' ')}</td>
                      <td style={{ padding: '13px 16px', fontSize: 13 }}>{o.image_count}</td>
                      <td style={{ padding: '13px 16px' }}>
                        <span style={{ padding: '3px 9px', borderRadius: 100, fontSize: 11, fontWeight: 600, background: sc.bg, color: sc.color }}>{sc.icon} {sc.label}</span>
                      </td>
                      <td style={{ padding: '13px 16px', fontSize: 12, color: '#6b7280' }}>{new Date(o.created_at).toLocaleDateString()}</td>
                      <td style={{ padding: '13px 16px' }}>
                        <Link href={`/admin/orders/${o.id}`} style={{ fontSize: 13, color: '#2563eb', textDecoration: 'none', fontWeight: 600 }}>Manage →</Link>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  )
}
