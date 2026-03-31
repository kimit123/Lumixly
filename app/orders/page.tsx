'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Sidebar from '@/components/Sidebar'
import { createClient } from '@/lib/supabase'

const STATUS_CONFIG: Record<string, {label:string;bg:string;color:string;icon:string}> = {
  pending:           {label:'Pending',        bg:'#f3f4f6',color:'#6b7280',icon:'◷'},
  in_progress:       {label:'In Progress',    bg:'#fef9c3',color:'#92400e',icon:'⟳'},
  ready_for_review:  {label:'Ready to Review',bg:'#dbeafe',color:'#1d4ed8',icon:'👁'},
  revision_requested:{label:'Revision Sent',  bg:'#fce7f3',color:'#be185d',icon:'↩'},
  completed:         {label:'Completed',      bg:'#dcfce7',color:'#16a34a',icon:'✓'},
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<any[]>([])
  const [profile, setProfile] = useState<any>(null)
  const router = useRouter()

  useEffect(() => {
    const sb = createClient()
    sb.auth.getUser().then(async ({ data }) => {
      if (!data.user) { router.push('/auth/login'); return }
      const pRes = await sb.from('profiles').select('*').eq('id', data.user.id).single()
      if (pRes.data?.role === 'admin') { router.push('/admin/orders'); return }
      setProfile(pRes.data)
      const { data: o } = await sb.from('orders').select('*').eq('customer_id', data.user.id).order('created_at', { ascending: false })
      setOrders(o || [])
    })
  }, [router])

  return (
    <div style={{ fontFamily: "'Inter',sans-serif", background: '#f9fafb', minHeight: '100vh' }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap'); *{box-sizing:border-box;}`}</style>
      <Sidebar role="customer" active="/orders" userName={profile?.full_name} plan={profile?.plan} />
      <main style={{ marginLeft: 240, padding: '40px 48px' }}>
        <div style={{ maxWidth: 900 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
            <div>
              <h1 style={{ fontSize: 24, fontWeight: 800, color: '#111', letterSpacing: '-0.5px' }}>My Orders</h1>
              <p style={{ fontSize: 14, color: '#6b7280', marginTop: 4 }}>{orders.length} total orders</p>
            </div>
            <Link href="/orders/new" style={{ background: '#2563eb', color: '#fff', padding: '10px 20px', borderRadius: 8, fontSize: 14, fontWeight: 700, textDecoration: 'none' }}>+ New Order</Link>
          </div>
          {orders.length === 0 ? (
            <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e5e7eb', padding: 60, textAlign: 'center' }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>📷</div>
              <p style={{ fontSize: 16, fontWeight: 600, color: '#111', marginBottom: 8 }}>No orders yet</p>
              <p style={{ fontSize: 14, color: '#6b7280', marginBottom: 20 }}>Place your first order to get started</p>
              <Link href="/orders/new" style={{ background: '#2563eb', color: '#fff', padding: '10px 24px', borderRadius: 8, fontSize: 14, fontWeight: 700, textDecoration: 'none' }}>Place Order →</Link>
            </div>
          ) : (
            <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e5e7eb' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead><tr style={{ background: '#f9fafb' }}>
                  {['Order','Service','Photos','Status','Date',''].map(h=><th key={h} style={{padding:'10px 20px',fontSize:11,fontWeight:600,color:'#6b7280',textAlign:'left',textTransform:'uppercase',letterSpacing:'0.5px'}}>{h}</th>)}
                </tr></thead>
                <tbody>
                  {orders.map(o => {
                    const sc = STATUS_CONFIG[o.status] || STATUS_CONFIG.pending
                    return (
                      <tr key={o.id} style={{ borderTop: '1px solid #f3f4f6' }}>
                        <td style={{ padding: '14px 20px', fontSize: 12, color: '#9ca3af', fontFamily: 'monospace' }}>#{o.id.slice(0, 8)}</td>
                        <td style={{ padding: '14px 20px', fontSize: 14, color: '#111', fontWeight: 500, textTransform: 'capitalize' }}>{o.service_type?.replace(/_/g, ' ')}</td>
                        <td style={{ padding: '14px 20px', fontSize: 14 }}>{o.image_count}</td>
                        <td style={{ padding: '14px 20px' }}>
                          <span style={{ padding: '4px 10px', borderRadius: 100, fontSize: 12, fontWeight: 600, background: sc.bg, color: sc.color }}>{sc.icon} {sc.label}</span>
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
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
