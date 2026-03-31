'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Sidebar from '@/components/Sidebar'
import { createClient } from '@/lib/supabase'

const STATUS_CONFIG: Record<string, { label: string; bg: string; color: string; icon: string }> = {
  pending:             { label: 'Pending',          bg: '#f3f4f6', color: '#6b7280', icon: '◷' },
  in_progress:         { label: 'In Progress',      bg: '#fef9c3', color: '#92400e', icon: '⟳' },
  ready_for_review:    { label: 'Ready to Review',  bg: '#dbeafe', color: '#1d4ed8', icon: '👁' },
  revision_requested:  { label: 'Revision Sent',    bg: '#fce7f3', color: '#be185d', icon: '↩' },
  completed:           { label: 'Completed',        bg: '#dcfce7', color: '#16a34a', icon: '✓' },
}

export default function CustomerDashboard() {
  const [profile, setProfile] = useState<any>(null)
  const [orders, setOrders] = useState<any[]>([])
  const [notifications, setNotifications] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const sb = createClient()
    sb.auth.getUser().then(async ({ data }) => {
      if (!data.user) { router.push('/auth/login'); return }
      const [profileRes, ordersRes, notifRes] = await Promise.all([
        sb.from('profiles').select('*').eq('id', data.user.id).single(),
        sb.from('orders').select('*').eq('customer_id', data.user.id).order('created_at', { ascending: false }).limit(5),
        sb.from('notifications').select('*').eq('user_id', data.user.id).eq('read', false).order('created_at', { ascending: false }).limit(5),
      ])
      if (profileRes.data?.role === 'admin') { router.push('/admin'); return }
      if (profileRes.data?.role === 'team') { router.push('/team'); return }
      setProfile(profileRes.data)
      setOrders(ordersRes.data || [])
      setNotifications(notifRes.data || [])
      setLoading(false)
    })
  }, [router])

  if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', fontFamily: 'Inter, sans-serif', color: '#6b7280' }}>Loading...</div>

  const activeOrders = orders.filter(o => o.status !== 'completed')
  const readyOrders = orders.filter(o => o.status === 'ready_for_review')

  return (
    <div style={{ fontFamily: "'Inter', sans-serif", background: '#f9fafb', minHeight: '100vh' }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap'); * { box-sizing: border-box; }`}</style>
      <Sidebar role="customer" active="/dashboard" userName={profile?.full_name} plan={profile?.plan} />
      <main style={{ marginLeft: 240, padding: '40px 48px', minHeight: '100vh' }}>
        <div style={{ maxWidth: 960 }}>

          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32 }}>
            <div>
              <h1 style={{ fontSize: 24, fontWeight: 800, color: '#111', letterSpacing: '-0.5px' }}>
                Welcome back{profile?.full_name ? `, ${profile.full_name.split(' ')[0]}` : ''}! 👋
              </h1>
              <p style={{ fontSize: 14, color: '#6b7280', marginTop: 4 }}>Here's what's happening with your orders</p>
            </div>
            <Link href="/orders/new" style={{ background: '#2563eb', color: '#fff', padding: '10px 20px', borderRadius: 8, fontSize: 14, fontWeight: 700, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 6 }}>
              + New Order
            </Link>
          </div>

          {/* Notifications banner */}
          {readyOrders.length > 0 && (
            <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 10, padding: '14px 18px', marginBottom: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 20 }}>👁</span>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#1d4ed8' }}>{readyOrders.length} order{readyOrders.length > 1 ? 's' : ''} ready for your review!</div>
                  <div style={{ fontSize: 13, color: '#3b82f6' }}>Review and approve the edited photos</div>
                </div>
              </div>
              <Link href="/orders" style={{ background: '#2563eb', color: '#fff', padding: '8px 16px', borderRadius: 7, fontSize: 13, fontWeight: 600, textDecoration: 'none' }}>Review Now →</Link>
            </div>
          )}

          {/* Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 28 }}>
            {[
              { label: 'Total Orders', value: orders.length, icon: '📋', color: '#2563eb' },
              { label: 'In Progress', value: activeOrders.length, icon: '⟳', color: '#f59e0b' },
              { label: 'Ready to Review', value: readyOrders.length, icon: '👁', color: '#7c3aed' },
              { label: 'Images Used', value: `${profile?.credits_used || 0}/${profile?.credits_limit || 10}`, icon: '🖼', color: '#059669' },
            ].map(s => (
              <div key={s.label} style={{ background: '#fff', borderRadius: 12, padding: '20px', border: '1px solid #e5e7eb' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ fontSize: 13, color: '#6b7280', fontWeight: 500 }}>{s.label}</div>
                  <span style={{ fontSize: 20 }}>{s.icon}</span>
                </div>
                <div style={{ fontSize: 28, fontWeight: 800, color: s.color, letterSpacing: '-1px', marginTop: 6 }}>{s.value}</div>
              </div>
            ))}
          </div>

          {/* Recent orders */}
          <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e5e7eb' }}>
            <div style={{ padding: '18px 24px', borderBottom: '1px solid #f3f4f6', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontSize: 16, fontWeight: 700, color: '#111' }}>Recent Orders</h2>
              <Link href="/orders" style={{ fontSize: 13, color: '#2563eb', textDecoration: 'none', fontWeight: 500 }}>View all →</Link>
            </div>
            {orders.length === 0 ? (
              <div style={{ padding: '60px 24px', textAlign: 'center' }}>
                <div style={{ fontSize: 48, marginBottom: 16 }}>📷</div>
                <p style={{ fontSize: 16, fontWeight: 600, color: '#111', marginBottom: 8 }}>No orders yet</p>
                <p style={{ fontSize: 14, color: '#6b7280', marginBottom: 20 }}>Upload your photos and we'll handle the rest</p>
                <Link href="/orders/new" style={{ background: '#2563eb', color: '#fff', padding: '10px 24px', borderRadius: 8, fontSize: 14, fontWeight: 700, textDecoration: 'none' }}>Place Your First Order →</Link>
              </div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#f9fafb' }}>
                    {['Order', 'Service', 'Photos', 'Status', 'Date', ''].map(h => (
                      <th key={h} style={{ padding: '10px 20px', fontSize: 11, fontWeight: 600, color: '#6b7280', textAlign: 'left', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {orders.map(o => {
                    const sc = STATUS_CONFIG[o.status] || STATUS_CONFIG.pending
                    return (
                      <tr key={o.id} style={{ borderTop: '1px solid #f3f4f6' }}>
                        <td style={{ padding: '14px 20px', fontSize: 12, color: '#9ca3af', fontFamily: 'monospace' }}>#{o.id.slice(0, 8)}</td>
                        <td style={{ padding: '14px 20px', fontSize: 14, color: '#111', fontWeight: 500, textTransform: 'capitalize' }}>{o.service_type?.replace(/_/g, ' ')}</td>
                        <td style={{ padding: '14px 20px', fontSize: 14, color: '#374151' }}>{o.image_count}</td>
                        <td style={{ padding: '14px 20px' }}>
                          <span style={{ padding: '4px 10px', borderRadius: 100, fontSize: 12, fontWeight: 600, background: sc.bg, color: sc.color }}>
                            {sc.icon} {sc.label}
                          </span>
                        </td>
                        <td style={{ padding: '14px 20px', fontSize: 13, color: '#6b7280' }}>{new Date(o.created_at).toLocaleDateString()}</td>
                        <td style={{ padding: '14px 20px' }}>
                          <Link href={`/orders/${o.id}`} style={{ fontSize: 13, color: '#2563eb', textDecoration: 'none', fontWeight: 600 }}>
                            {o.status === 'ready_for_review' ? '👁 Review' : 'View →'}
                          </Link>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
