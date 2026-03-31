'use client'
import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Sidebar from '@/components/Sidebar'
import { createClient } from '@/lib/supabase'
import { Suspense } from 'react'

const STATUS_CONFIG: Record<string, {label:string;bg:string;color:string;icon:string}> = {
  pending:           {label:'Pending',         bg:'#f3f4f6',color:'#6b7280',icon:'◷'},
  in_progress:       {label:'In Progress',     bg:'#fef9c3',color:'#92400e',icon:'⟳'},
  ready_for_review:  {label:'Ready for Review',bg:'#dbeafe',color:'#1d4ed8',icon:'👁'},
  revision_requested:{label:'Revision',        bg:'#fce7f3',color:'#be185d',icon:'↩'},
  completed:         {label:'Completed',       bg:'#dcfce7',color:'#16a34a',icon:'✓'},
}

function AdminOrdersContent() {
  const [orders, setOrders] = useState<any[]>([])
  const [profile, setProfile] = useState<any>(null)
  const [filter, setFilter] = useState('all')
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const f = searchParams.get('filter')
    if (f) setFilter(f)
    const sb = createClient()
    sb.auth.getUser().then(async ({ data }) => {
      if (!data.user) { router.push('/auth/login'); return }
      const pRes = await sb.from('profiles').select('*').eq('id', data.user.id).single()
      if (!['admin','team'].includes(pRes.data?.role)) { router.push('/dashboard'); return }
      setProfile(pRes.data)
      const { data: o } = await sb.from('orders').select('*, profiles!customer_id(full_name)').order('created_at',{ascending:false})
      setOrders(o || [])
      setLoading(false)
    })
  }, [router, searchParams])

  const filtered = filter === 'all' ? orders : orders.filter(o => o.status === filter)

  return (
    <div style={{fontFamily:"'Inter',sans-serif",background:'#f9fafb',minHeight:'100vh'}}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap'); *{box-sizing:border-box;}`}</style>
      <Sidebar role={profile?.role||'admin'} active="/admin/orders" userName={profile?.full_name} />
      <main style={{marginLeft:240,padding:'40px 48px'}}>
        <div style={{maxWidth:1000}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:28}}>
            <div>
              <h1 style={{fontSize:24,fontWeight:800,color:'#111',letterSpacing:'-0.5px'}}>All Orders</h1>
              <p style={{fontSize:14,color:'#6b7280',marginTop:4}}>{orders.length} total orders</p>
            </div>
          </div>
          <div style={{display:'flex',gap:8,marginBottom:20,flexWrap:'wrap'}}>
            {['all','pending','in_progress','ready_for_review','revision_requested','completed'].map(s=>(
              <button key={s} onClick={()=>setFilter(s)} style={{padding:'7px 14px',borderRadius:8,border:'1.5px solid',borderColor:filter===s?'#2563eb':'#d1d5db',background:filter===s?'#eff6ff':'#fff',color:filter===s?'#2563eb':'#6b7280',fontSize:13,fontWeight:600,cursor:'pointer',textTransform:'capitalize'}}>
                {s==='all'?'All':STATUS_CONFIG[s]?.label||s}
                <span style={{marginLeft:6,background:filter===s?'#2563eb':'#e5e7eb',color:filter===s?'#fff':'#6b7280',fontSize:11,fontWeight:700,padding:'1px 7px',borderRadius:100}}>
                  {s==='all'?orders.length:orders.filter(o=>o.status===s).length}
                </span>
              </button>
            ))}
          </div>
          <div style={{background:'#fff',borderRadius:12,border:'1px solid #e5e7eb'}}>
            <table style={{width:'100%',borderCollapse:'collapse'}}>
              <thead><tr style={{background:'#f9fafb'}}>
                {['Order','Customer','Service','Photos','Status','Date',''].map(h=>(
                  <th key={h} style={{padding:'10px 16px',fontSize:11,fontWeight:600,color:'#6b7280',textAlign:'left',textTransform:'uppercase',letterSpacing:'0.5px'}}>{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {filtered.map(o=>{
                  const sc=STATUS_CONFIG[o.status]||STATUS_CONFIG.pending
                  return(
                    <tr key={o.id} style={{borderTop:'1px solid #f3f4f6'}}>
                      <td style={{padding:'14px 16px',fontSize:12,color:'#9ca3af',fontFamily:'monospace'}}>#{o.id.slice(0,8)}</td>
                      <td style={{padding:'14px 16px',fontSize:13,color:'#111',fontWeight:500}}>{(o.profiles as any)?.full_name||'—'}</td>
                      <td style={{padding:'14px 16px',fontSize:13,color:'#374151',textTransform:'capitalize'}}>{o.service_type?.replace(/_/g,' ')}</td>
                      <td style={{padding:'14px 16px',fontSize:13}}>{o.image_count}</td>
                      <td style={{padding:'14px 16px'}}>
                        <span style={{padding:'3px 9px',borderRadius:100,fontSize:11,fontWeight:600,background:sc.bg,color:sc.color}}>{sc.icon} {sc.label}</span>
                      </td>
                      <td style={{padding:'14px 16px',fontSize:12,color:'#6b7280'}}>{new Date(o.created_at).toLocaleDateString()}</td>
                      <td style={{padding:'14px 16px'}}>
                        <Link href={`/admin/orders/${o.id}`} style={{fontSize:13,color:'#2563eb',textDecoration:'none',fontWeight:600}}>Manage →</Link>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
            {filtered.length===0&&<div style={{padding:48,textAlign:'center',color:'#9ca3af',fontSize:14}}>No orders found</div>}
          </div>
        </div>
      </main>
    </div>
  )
}

export default function AdminOrders() {
  return <Suspense fallback={<div style={{display:'flex',alignItems:'center',justifyContent:'center',height:'100vh',fontFamily:'Inter,sans-serif',color:'#6b7280'}}>Loading...</div>}><AdminOrdersContent /></Suspense>
}
