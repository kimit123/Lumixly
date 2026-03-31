'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Sidebar from '@/components/Sidebar'
import { createClient } from '@/lib/supabase'

const STATUS_CONFIG: Record<string, {label:string;bg:string;color:string;icon:string}> = {
  pending:           {label:'Pending',        bg:'#f3f4f6',color:'#6b7280',icon:'◷'},
  in_progress:       {label:'In Progress',    bg:'#fef9c3',color:'#92400e',icon:'⟳'},
  ready_for_review:  {label:'Ready for Review',bg:'#dbeafe',color:'#1d4ed8',icon:'👁'},
  revision_requested:{label:'Revision',       bg:'#fce7f3',color:'#be185d',icon:'↩'},
  completed:         {label:'Completed',      bg:'#dcfce7',color:'#16a34a',icon:'✓'},
}

export default function TeamDashboard() {
  const [orders, setOrders] = useState<any[]>([])
  const [profile, setProfile] = useState<any>(null)
  const router = useRouter()

  useEffect(() => {
    const sb = createClient()
    sb.auth.getUser().then(async ({ data }) => {
      if (!data.user) { router.push('/auth/login'); return }
      const pRes = await sb.from('profiles').select('*').eq('id', data.user.id).single()
      if (pRes.data?.role !== 'team') { router.push('/dashboard'); return }
      setProfile(pRes.data)
      const { data: o } = await sb.from('orders').select('*, profiles!customer_id(full_name)').eq('assigned_to', data.user.id).order('created_at', { ascending: false })
      setOrders(o || [])
    })
  }, [router])

  return (
    <div style={{ fontFamily: "'Inter',sans-serif", background: '#f9fafb', minHeight: '100vh' }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap'); *{box-sizing:border-box;}`}</style>
      <Sidebar role="team" active="/team" userName={profile?.full_name} />
      <main style={{ marginLeft: 240, padding: '40px 48px' }}>
        <div style={{ maxWidth: 900 }}>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: '#111', letterSpacing: '-0.5px', marginBottom: 6 }}>My Assigned Orders</h1>
          <p style={{ fontSize: 14, color: '#6b7280', marginBottom: 28 }}>{orders.length} orders assigned to you</p>

          {orders.length === 0 ? (
            <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e5e7eb', padding: 60, textAlign: 'center' }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>📭</div>
              <p style={{ fontSize: 15, color: '#6b7280' }}>No orders assigned to you yet</p>
            </div>
          ) : (
            <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e5e7eb' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead><tr style={{ background: '#f9fafb' }}>
                  {['Order','Customer','Service','Photos','Status','Date',''].map(h=><th key={h} style={{padding:'10px 20px',fontSize:11,fontWeight:600,color:'#6b7280',textAlign:'left',textTransform:'uppercase'}}>{h}</th>)}
                </tr></thead>
                <tbody>
                  {orders.map(o => {
                    const sc = STATUS_CONFIG[o.status] || STATUS_CONFIG.pending
                    return (
                      <tr key={o.id} style={{ borderTop: '1px solid #f3f4f6' }}>
                        <td style={{ padding: '14px 20px', fontSize: 12, color: '#9ca3af', fontFamily: 'monospace' }}>#{o.id.slice(0, 8)}</td>
                        <td style={{ padding: '14px 20px', fontSize: 13, fontWeight: 500, color: '#111' }}>{(o.profiles as any)?.full_name || '—'}</td>
                        <td style={{ padding: '14px 20px', fontSize: 13, textTransform: 'capitalize' }}>{o.service_type?.replace(/_/g, ' ')}</td>
                        <td style={{ padding: '14px 20px', fontSize: 13 }}>{o.image_count}</td>
                        <td style={{ padding: '14px 20px' }}>
                          <span style={{ padding: '3px 9px', borderRadius: 100, fontSize: 11, fontWeight: 600, background: sc.bg, color: sc.color }}>{sc.icon} {sc.label}</span>
                        </td>
                        <td style={{ padding: '14px 20px', fontSize: 12, color: '#6b7280' }}>{new Date(o.created_at).toLocaleDateString()}</td>
                        <td style={{ padding: '14px 20px' }}>
                          <Link href={`/admin/orders/${o.id}`} style={{ fontSize: 13, color: '#2563eb', textDecoration: 'none', fontWeight: 600 }}>Work on it →</Link>
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
