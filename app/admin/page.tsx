'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'

const ADMIN_EMAIL = 'shahkimit76@gmail.com' // Change to your email

function AdminSidebar({ active }: { active: string }) {
  const router = useRouter()
  const links = [
    { href: '/admin', label: 'Overview', icon: '⊞' },
    { href: '/admin/customers', label: 'Customers', icon: '👥' },
    { href: '/admin/orders', label: 'All Orders', icon: '📋' },
  ]
  return (
    <aside style={{ width: 240, background: '#111', height: '100vh', position: 'fixed', left: 0, top: 0, display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <div style={{ fontSize: 18, fontWeight: 800, color: '#fff', letterSpacing: '-0.5px' }}>Lumixly</div>
        <div style={{ fontSize: 11, color: '#6b7280', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px', marginTop: 2 }}>Admin</div>
      </div>
      <nav style={{ flex: 1, padding: '16px 12px' }}>
        {links.map(l => (
          <Link key={l.href} href={l.href} style={{
            display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', borderRadius: 8, marginBottom: 2,
            fontSize: 14, fontWeight: active === l.href ? 600 : 400,
            color: active === l.href ? '#fff' : 'rgba(255,255,255,0.5)',
            background: active === l.href ? 'rgba(255,255,255,0.08)' : 'transparent',
            textDecoration: 'none',
          }}>
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

function StatCard({ label, value, sub, color }: any) {
  return (
    <div style={{ background: '#fff', borderRadius: 12, padding: 24, border: '1px solid #e5e7eb' }}>
      <div style={{ fontSize: 13, color: '#6b7280', fontWeight: 500, marginBottom: 8 }}>{label}</div>
      <div style={{ fontSize: 36, fontWeight: 800, color: color || '#111', letterSpacing: '-1px', lineHeight: 1 }}>{value}</div>
      {sub && <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 6 }}>{sub}</div>}
    </div>
  )
}

export default function AdminDashboard() {
  const [stats, setStats] = useState({ users: 0, orders: 0, revenue: 0, processing: 0 })
  const [recentOrders, setRecentOrders] = useState<any[]>([])
  const [recentUsers, setRecentUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const sb = createClient()
    sb.auth.getUser().then(async ({ data }) => {
      if (!data.user || data.user.email !== ADMIN_EMAIL) {
        router.push('/dashboard'); return
      }
      // Fetch stats
      const [usersRes, ordersRes, processingRes, recentOrdersRes, recentUsersRes] = await Promise.all([
        sb.from('profiles').select('id, plan', { count: 'exact' }),
        sb.from('orders').select('id', { count: 'exact' }),
        sb.from('orders').select('id', { count: 'exact' }).eq('status', 'processing'),
        sb.from('orders').select('*, profiles(full_name, plan)').order('created_at', { ascending: false }).limit(10),
        sb.from('profiles').select('*').order('created_at', { ascending: false }).limit(8),
      ])

      // Calculate revenue from paid plans
      const paidUsers = usersRes.data?.filter(u => u.plan === 'starter' || u.plan === 'pro') || []
      const revenue = paidUsers.reduce((acc, u) => acc + (u.plan === 'starter' ? 19 : u.plan === 'pro' ? 49 : 0), 0)

      setStats({
        users: usersRes.count || 0,
        orders: ordersRes.count || 0,
        processing: processingRes.count || 0,
        revenue,
      })
      setRecentOrders(recentOrdersRes.data || [])
      setRecentUsers(recentUsersRes.data || [])
      setLoading(false)
    })
  }, [router])

  if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', fontFamily: 'Inter, sans-serif', color: '#6b7280' }}>Loading...</div>

  return (
    <div style={{ fontFamily: "'Inter', sans-serif", background: '#f9fafb', minHeight: '100vh' }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap'); * { box-sizing: border-box; }`}</style>
      <AdminSidebar active="/admin" />
      <main style={{ marginLeft: 240, padding: '40px 48px' }}>
        <div style={{ maxWidth: 1060 }}>
          <div style={{ marginBottom: 36 }}>
            <h1 style={{ fontSize: 24, fontWeight: 800, color: '#111', letterSpacing: '-0.5px' }}>Admin Overview</h1>
            <p style={{ fontSize: 14, color: '#6b7280', marginTop: 4 }}>Your business at a glance</p>
          </div>

          {/* Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20, marginBottom: 32 }}>
            <StatCard label="Total Customers" value={stats.users} sub="registered accounts" color="#2563eb" />
            <StatCard label="Monthly Revenue" value={`£${stats.revenue}`} sub="from active plans" color="#059669" />
            <StatCard label="Total Orders" value={stats.orders} sub="all time" color="#7c3aed" />
            <StatCard label="Processing Now" value={stats.processing} sub="in queue" color={stats.processing > 0 ? '#f59e0b' : '#9ca3af'} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 24 }}>
            {/* Recent orders */}
            <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e5e7eb' }}>
              <div style={{ padding: '18px 24px', borderBottom: '1px solid #f3f4f6', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2 style={{ fontSize: 15, fontWeight: 700, color: '#111' }}>Recent Orders</h2>
                <Link href="/admin/orders" style={{ fontSize: 13, color: '#2563eb', textDecoration: 'none' }}>View all →</Link>
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#f9fafb' }}>
                    {['Customer', 'Type', 'Imgs', 'Status'].map(h => (
                      <th key={h} style={{ padding: '9px 16px', fontSize: 11, fontWeight: 600, color: '#6b7280', textAlign: 'left', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {recentOrders.map(o => (
                    <tr key={o.id} style={{ borderTop: '1px solid #f3f4f6' }}>
                      <td style={{ padding: '12px 16px', fontSize: 13, color: '#374151', fontWeight: 500 }}>{(o.profiles as any)?.full_name || 'Unknown'}</td>
                      <td style={{ padding: '12px 16px', fontSize: 12, color: '#6b7280', textTransform: 'capitalize' }}>{o.crop_type?.replace('_', ' ')}</td>
                      <td style={{ padding: '12px 16px', fontSize: 13, color: '#374151' }}>{o.image_count}</td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{ padding: '2px 8px', borderRadius: 100, fontSize: 11, fontWeight: 600, background: o.status === 'done' ? '#dcfce7' : o.status === 'error' ? '#fee2e2' : '#fef9c3', color: o.status === 'done' ? '#16a34a' : o.status === 'error' ? '#dc2626' : '#92400e' }}>
                          {o.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Recent customers */}
            <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e5e7eb' }}>
              <div style={{ padding: '18px 24px', borderBottom: '1px solid #f3f4f6', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2 style={{ fontSize: 15, fontWeight: 700, color: '#111' }}>Recent Customers</h2>
                <Link href="/admin/customers" style={{ fontSize: 13, color: '#2563eb', textDecoration: 'none' }}>View all →</Link>
              </div>
              <div>
                {recentUsers.map(u => (
                  <div key={u.id} style={{ padding: '14px 20px', borderTop: '1px solid #f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: '#111' }}>{u.full_name || 'Unknown'}</div>
                      <div style={{ fontSize: 12, color: '#9ca3af' }}>{u.credits_used || 0} images used</div>
                    </div>
                    <span style={{ padding: '3px 10px', borderRadius: 100, fontSize: 11, fontWeight: 700, background: u.plan === 'pro' ? '#ede9fe' : u.plan === 'starter' ? '#dbeafe' : '#f3f4f6', color: u.plan === 'pro' ? '#7c3aed' : u.plan === 'starter' ? '#2563eb' : '#6b7280', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      {u.plan || 'free'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
