'use client'
import { useEffect, useState } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Sidebar from '@/components/Sidebar'
import { createClient } from '@/lib/supabase'
import { Suspense } from 'react'

const STATUS_CONFIG: Record<string,{label:string;bg:string;color:string;icon:string;desc:string}> = {
  pending:           {label:'Pending',          bg:'#f3f4f6',color:'#6b7280',icon:'◷',desc:"Your order has been received. Our team will start working on it shortly."},
  in_progress:       {label:'In Progress',      bg:'#fef9c3',color:'#92400e',icon:'⟳',desc:"Our team is currently editing your photos."},
  ready_for_review:  {label:'Ready to Review',  bg:'#dbeafe',color:'#1d4ed8',icon:'👁',desc:"Your edited photos are ready! Please review and approve or request changes."},
  revision_requested:{label:'Revision Sent',    bg:'#fce7f3',color:'#be185d',icon:'↩',desc:"Your revision request has been sent. We'll update you when ready."},
  completed:         {label:'Completed',        bg:'#dcfce7',color:'#16a34a',icon:'✓',desc:"Order complete! Download your photos below."},
}

function OrderDetailContent() {
  const params       = useParams()
  const searchParams = useSearchParams()
  const [order, setOrder]       = useState<any>(null)
  const [profile, setProfile]   = useState<any>(null)
  const [messages, setMessages] = useState<any[]>([])
  const [completedUrls, setCompletedUrls] = useState<{path:string,url:string}[]>([])
  const [originalUrls, setOriginalUrls]   = useState<{path:string,url:string}[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [feedback, setFeedback]     = useState('')
  const [loading, setLoading]       = useState(true)
  const [showFeedback, setShowFeedback] = useState(false)
  const isNew = searchParams.get('success') === '1'

  useEffect(() => {
    const sb = createClient()
    sb.auth.getUser().then(async ({ data }) => {
      if (!data.user) return
      const [pRes, oRes, mRes] = await Promise.all([
        sb.from('profiles').select('*').eq('id', data.user.id).single(),
        sb.from('orders').select('*').eq('id', params.id).single(),
        sb.from('messages').select('*').eq('order_id', params.id).order('created_at'),
      ])
      setProfile(pRes.data)
      const o = oRes.data
      setOrder(o)
      setMessages(mRes.data || [])

      // Get signed URLs for original photos (customer uploaded)
      if (o?.original_urls?.length) {
        const urls = await Promise.all(
          o.original_urls.map(async (path: string) => {
            const { data: signed } = await sb.storage.from('originals').createSignedUrl(path, 3600)
            return { path, url: signed?.signedUrl || '' }
          })
        )
        setOriginalUrls(urls.filter(u => u.url))
      }

      // Get public URLs for completed photos
      if (o?.completed_urls?.length) {
        const urls = o.completed_urls.map((path: string) => {
          const { data: pub } = sb.storage.from('completed').getPublicUrl(path)
          return { path, url: pub?.publicUrl || '' }
        })
        setCompletedUrls(urls.filter((u: any) => u.url))
      }

      setLoading(false)
    })
  }, [params.id])

  const handleApprove = async () => {
    const sb = createClient()
    await sb.from('orders').update({ status: 'completed', completed_at: new Date().toISOString() }).eq('id', order.id)
    setOrder({ ...order, status: 'completed' })
  }

  const handleRevision = async () => {
    if (!feedback.trim()) return
    const sb = createClient()
    await sb.from('orders').update({
      status: 'revision_requested',
      customer_feedback: feedback,
      revision_count: (order.revision_count || 0) + 1,
    }).eq('id', order.id)
    await sb.from('messages').insert({
      order_id: order.id, sender_id: profile.id, role: 'customer',
      content: `Revision request: ${feedback}`,
    })
    setOrder({ ...order, status: 'revision_requested', customer_feedback: feedback })
    setShowFeedback(false); setFeedback('')
  }

  const sendMessage = async () => {
    if (!newMessage.trim()) return
    const sb = createClient()
    const { data } = await sb.from('messages').insert({
      order_id: order.id, sender_id: profile.id, role: profile?.role || 'customer', content: newMessage
    }).select().single()
    if (data) setMessages(prev => [...prev, data])
    setNewMessage('')
  }

  const downloadAll = () => {
    completedUrls.forEach(({url, path}, i) => {
      setTimeout(() => {
        const a = document.createElement('a')
        a.href = url
        a.download = `lumixly_${i+1}_${path.split('/').pop()}`
        a.target = '_blank'
        a.click()
      }, i * 400)
    })
  }

  if (loading) return <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:'100vh',fontFamily:'Inter,sans-serif',color:'#6b7280'}}>Loading...</div>
  if (!order)  return <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:'100vh'}}>Order not found</div>

  const sc      = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending
  const isReady = order.status === 'ready_for_review'
  const isDone  = order.status === 'completed'

  return (
    <div style={{fontFamily:"'Inter',sans-serif",background:'#f9fafb',minHeight:'100vh'}}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap'); *{box-sizing:border-box;}`}</style>
      <Sidebar role={profile?.role||'customer'} active="/orders" userName={profile?.full_name} plan={profile?.plan} />
      <main style={{marginLeft:240,padding:'40px 48px'}}>
        <div style={{maxWidth:860}}>

          {/* Success banner */}
          {isNew && (
            <div style={{background:'#dcfce7',border:'1px solid #86efac',borderRadius:10,padding:'14px 18px',marginBottom:24,display:'flex',alignItems:'center',gap:10}}>
              <span style={{fontSize:20}}>🎉</span>
              <div>
                <div style={{fontSize:14,fontWeight:700,color:'#16a34a'}}>Order placed successfully!</div>
                <div style={{fontSize:13,color:'#15803d'}}>We'll notify you as soon as your photos are ready to review. Typical turnaround: 24–48 hours.</div>
              </div>
            </div>
          )}

          {/* Header */}
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:28}}>
            <div>
              <Link href="/orders" style={{fontSize:13,color:'#6b7280',textDecoration:'none',display:'block',marginBottom:8}}>← All Orders</Link>
              <h1 style={{fontSize:24,fontWeight:800,color:'#111',letterSpacing:'-0.5px'}}>Order #{order.id.slice(0,8)}</h1>
              <p style={{fontSize:14,color:'#6b7280',marginTop:4}}>
                {order.image_count} photos • {order.service_type?.replace(/_/g,' ')} • {new Date(order.created_at).toLocaleDateString()}
              </p>
            </div>
            <span style={{padding:'8px 16px',borderRadius:100,fontSize:13,fontWeight:700,background:sc.bg,color:sc.color}}>
              {sc.icon} {sc.label}
            </span>
          </div>

          {/* Status description */}
          <div style={{background:'#fff',borderRadius:12,border:'1px solid #e5e7eb',padding:20,marginBottom:20}}>
            <p style={{fontSize:14,color:'#374151',lineHeight:1.7,margin:0}}>{sc.desc}</p>
            {order.revision_count > 0 && (
              <p style={{fontSize:13,color:'#9ca3af',marginTop:8,marginBottom:0}}>Revisions requested: {order.revision_count}</p>
            )}
          </div>

          {/* Progress bar */}
          {!isDone && (
            <div style={{background:'#fff',borderRadius:12,border:'1px solid #e5e7eb',padding:'20px 24px',marginBottom:20}}>
              <h3 style={{fontSize:14,fontWeight:700,color:'#111',marginBottom:20}}>Order Progress</h3>
              <div style={{display:'flex',alignItems:'center'}}>
                {[{key:'pending',label:'Received'},{key:'in_progress',label:'Editing'},{key:'ready_for_review',label:'Review'},{key:'completed',label:'Done'}].map((step,i,arr) => {
                  const steps = ['pending','in_progress','ready_for_review','completed']
                  const cur   = steps.indexOf(order.status === 'revision_requested' ? 'ready_for_review' : order.status)
                  const idx   = steps.indexOf(step.key)
                  const done  = cur >= idx
                  const curr  = cur === idx
                  return (
                    <div key={step.key} style={{display:'flex',alignItems:'center',flex:i<arr.length-1?1:0}}>
                      <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:6}}>
                        <div style={{width:32,height:32,borderRadius:'50%',background:curr?'#2563eb':done?'#dcfce7':'#f3f4f6',border:`2px solid ${curr?'#2563eb':done?'#86efac':'#e5e7eb'}`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:13,fontWeight:700,color:curr?'#fff':done?'#16a34a':'#d1d5db'}}>
                          {done&&!curr?'✓':i+1}
                        </div>
                        <span style={{fontSize:11,fontWeight:curr?700:500,color:curr?'#2563eb':done?'#111':'#9ca3af',whiteSpace:'nowrap'}}>{step.label}</span>
                      </div>
                      {i<arr.length-1 && <div style={{flex:1,height:2,background:done?'#86efac':'#f3f4f6',margin:'0 4px',marginBottom:20}} />}
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Uploaded photos — customer can see what they uploaded */}
          {originalUrls.length > 0 && (
            <div style={{background:'#fff',borderRadius:12,border:'1px solid #e5e7eb',padding:24,marginBottom:20}}>
              <h3 style={{fontSize:15,fontWeight:700,color:'#111',marginBottom:4}}>📸 Your Uploaded Photos</h3>
              <p style={{fontSize:13,color:'#6b7280',marginBottom:16}}>{originalUrls.length} photos submitted for editing</p>
              <div style={{display:'grid',gridTemplateColumns:'repeat(5,1fr)',gap:8}}>
                {originalUrls.map(({url},i) => (
                  <div key={i} style={{borderRadius:8,overflow:'hidden',border:'1px solid #e5e7eb',aspectRatio:'1',background:'#f9fafb'}}>
                    <img src={url} alt={`Photo ${i+1}`} style={{width:'100%',height:'100%',objectFit:'cover'}} />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* REVIEW section */}
          {isReady && (
            <div style={{background:'#eff6ff',border:'2px solid #2563eb',borderRadius:12,padding:24,marginBottom:20}}>
              <h3 style={{fontSize:16,fontWeight:800,color:'#1d4ed8',marginBottom:4}}>👁 Your photos are ready to review!</h3>
              <p style={{fontSize:14,color:'#3b82f6',marginBottom:20}}>Download and check the edited photos, then approve or request changes.</p>

              {completedUrls.length > 0 && (
                <div style={{marginBottom:20}}>
                  <button onClick={downloadAll} style={{background:'#2563eb',color:'#fff',padding:'10px 20px',borderRadius:8,fontSize:14,fontWeight:700,border:'none',cursor:'pointer',marginBottom:12,display:'flex',alignItems:'center',gap:6}}>
                    ↓ Download All {completedUrls.length} Edited Photos
                  </button>
                  <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:8}}>
                    {completedUrls.map(({url},i) => (
                      <a key={i} href={url} download target="_blank" rel="noreferrer"
                        style={{display:'block',borderRadius:8,overflow:'hidden',border:'1px solid #bfdbfe',aspectRatio:'1',background:'#f0f9ff',position:'relative'}}>
                        <img src={url} alt={`Edited ${i+1}`} style={{width:'100%',height:'100%',objectFit:'cover'}} />
                        <div style={{position:'absolute',bottom:0,left:0,right:0,background:'rgba(37,99,235,0.7)',color:'#fff',fontSize:10,padding:'3px',textAlign:'center'}}>↓</div>
                      </a>
                    ))}
                  </div>
                </div>
              )}

              <div style={{display:'flex',gap:12}}>
                <button onClick={handleApprove} style={{flex:1,background:'#16a34a',color:'#fff',padding:12,borderRadius:8,fontSize:14,fontWeight:700,border:'none',cursor:'pointer'}}>
                  ✓ Approve & Complete Order
                </button>
                <button onClick={()=>setShowFeedback(!showFeedback)} style={{flex:1,background:'#fff',color:'#dc2626',padding:12,borderRadius:8,fontSize:14,fontWeight:700,border:'2px solid #fca5a5',cursor:'pointer'}}>
                  ↩ Request Revision
                </button>
              </div>

              {showFeedback && (
                <div style={{marginTop:16}}>
                  <textarea value={feedback} onChange={e=>setFeedback(e.target.value)} placeholder="Describe what changes you need..." style={{width:'100%',padding:'10px 12px',border:'1.5px solid #d1d5db',borderRadius:8,fontSize:14,resize:'vertical',minHeight:80,marginBottom:10,outline:'none',fontFamily:'Inter,sans-serif'}} />
                  <button onClick={handleRevision} style={{background:'#dc2626',color:'#fff',padding:'10px 20px',borderRadius:8,fontSize:14,fontWeight:700,border:'none',cursor:'pointer'}}>
                    Send Revision Request
                  </button>
                </div>
              )}
            </div>
          )}

          {/* COMPLETED — download */}
          {isDone && completedUrls.length > 0 && (
            <div style={{background:'#fff',borderRadius:12,border:'1px solid #e5e7eb',padding:24,marginBottom:20}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
                <h3 style={{fontSize:15,fontWeight:700,color:'#111',margin:0}}>✓ Your Edited Photos</h3>
                <button onClick={downloadAll} style={{background:'#2563eb',color:'#fff',padding:'9px 18px',borderRadius:8,fontSize:13,fontWeight:700,border:'none',cursor:'pointer'}}>↓ Download All</button>
              </div>
              <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:8}}>
                {completedUrls.map(({url},i) => (
                  <a key={i} href={url} download target="_blank" rel="noreferrer"
                    style={{display:'block',borderRadius:8,overflow:'hidden',border:'1px solid #e5e7eb',aspectRatio:'1',background:'#f9fafb',position:'relative'}}>
                    <img src={url} alt={`Edited ${i+1}`} style={{width:'100%',height:'100%',objectFit:'cover'}} />
                    <div style={{position:'absolute',bottom:0,left:0,right:0,background:'rgba(0,0,0,0.4)',color:'#fff',fontSize:10,padding:'3px',textAlign:'center'}}>↓ Download</div>
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Notes */}
          {order.notes && (
            <div style={{background:'#fff',borderRadius:12,border:'1px solid #e5e7eb',padding:20,marginBottom:20}}>
              <h3 style={{fontSize:14,fontWeight:700,color:'#111',marginBottom:8}}>Your Instructions</h3>
              <p style={{fontSize:14,color:'#374151',lineHeight:1.6,margin:0}}>{order.notes}</p>
            </div>
          )}

          {/* Messages */}
          <div style={{background:'#fff',borderRadius:12,border:'1px solid #e5e7eb'}}>
            <div style={{padding:'18px 24px',borderBottom:'1px solid #f3f4f6'}}>
              <h3 style={{fontSize:15,fontWeight:700,color:'#111',margin:0}}>Messages</h3>
            </div>
            <div style={{padding:20}}>
              {messages.length===0 ? (
                <p style={{fontSize:14,color:'#9ca3af',textAlign:'center',padding:'20px 0',margin:0}}>No messages yet. Ask our team anything below.</p>
              ) : (
                <div style={{display:'flex',flexDirection:'column',gap:12,marginBottom:16}}>
                  {messages.map(m => (
                    <div key={m.id} style={{display:'flex',justifyContent:m.role==='customer'?'flex-end':'flex-start'}}>
                      <div style={{maxWidth:'70%',background:m.role==='customer'?'#eff6ff':'#f9fafb',border:'1px solid',borderColor:m.role==='customer'?'#bfdbfe':'#e5e7eb',borderRadius:10,padding:'10px 14px'}}>
                        <div style={{fontSize:11,fontWeight:600,color:'#9ca3af',marginBottom:4,textTransform:'capitalize'}}>{m.role}</div>
                        <div style={{fontSize:14,color:'#111',lineHeight:1.5}}>{m.content}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <div style={{display:'flex',gap:10}}>
                <input value={newMessage} onChange={e=>setNewMessage(e.target.value)} onKeyDown={e=>e.key==='Enter'&&sendMessage()} placeholder="Send a message to our team..." style={{flex:1,padding:'10px 14px',border:'1.5px solid #d1d5db',borderRadius:8,fontSize:14,outline:'none'}} />
                <button onClick={sendMessage} style={{background:'#2563eb',color:'#fff',padding:'10px 16px',borderRadius:8,fontSize:14,fontWeight:700,border:'none',cursor:'pointer'}}>Send</button>
              </div>
            </div>
          </div>

        </div>
      </main>
    </div>
  )
}

export default function OrderDetailPage() {
  return (
    <Suspense fallback={<div style={{display:'flex',alignItems:'center',justifyContent:'center',height:'100vh',fontFamily:'Inter,sans-serif',color:'#6b7280'}}>Loading...</div>}>
      <OrderDetailContent />
    </Suspense>
  )
}
