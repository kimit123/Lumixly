'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import Sidebar from '@/components/Sidebar'
import { createClient } from '@/lib/supabase'

const STATUSES = ['pending','in_progress','ready_for_review','revision_requested','completed']
const STATUS_LABELS: Record<string,string> = {
  pending:'Pending', in_progress:'In Progress', ready_for_review:'Ready for Review',
  revision_requested:'Revision Requested', completed:'Completed',
}
const STATUS_COLORS: Record<string,{bg:string,color:string}> = {
  pending:           {bg:'#f3f4f6',color:'#6b7280'},
  in_progress:       {bg:'#fef9c3',color:'#92400e'},
  ready_for_review:  {bg:'#dbeafe',color:'#1d4ed8'},
  revision_requested:{bg:'#fce7f3',color:'#be185d'},
  completed:         {bg:'#dcfce7',color:'#16a34a'},
}

export default function AdminOrderDetail() {
  const params  = useParams()
  const router  = useRouter()
  const [order, setOrder]           = useState<any>(null)
  const [profile, setProfile]       = useState<any>(null)
  const [teamMembers, setTeamMembers] = useState<any[]>([])
  const [messages, setMessages]     = useState<any[]>([])
  const [originals, setOriginals]   = useState<{path:string, url:string}[]>([])
  const [files, setFiles]           = useState<File[]>([])
  const [uploading, setUploading]   = useState(false)
  const [progress, setProgress]     = useState(0)
  const [newMessage, setNewMessage] = useState('')
  const [newStatus, setNewStatus]   = useState('')
  const [loading, setLoading]       = useState(true)
  const [dragOver, setDragOver]     = useState(false)
  const [uploadError, setUploadError] = useState('')

  useEffect(() => {
    const sb = createClient()
    sb.auth.getUser().then(async ({ data }) => {
      if (!data.user) { router.push('/auth/login'); return }
      const pRes = await sb.from('profiles').select('*').eq('id', data.user.id).single()
      if (!['admin','team'].includes(pRes.data?.role)) { router.push('/dashboard'); return }
      setProfile(pRes.data)

      const [orderRes, teamRes, msgRes] = await Promise.all([
        sb.from('orders').select('*, profiles!customer_id(full_name, email)').eq('id', params.id).single(),
        sb.from('profiles').select('*').eq('role', 'team'),
        sb.from('messages').select('*').eq('order_id', params.id).order('created_at'),
      ])
      const o = orderRes.data
      setOrder(o)
      setNewStatus(o?.status || 'pending')
      setTeamMembers(teamRes.data || [])
      setMessages(msgRes.data || [])

      // Generate signed URLs for original photos so admin can preview + download
      if (o?.original_urls?.length) {
        const urls = await Promise.all(
          o.original_urls.map(async (path: string) => {
            const { data: signed } = await sb.storage.from('originals').createSignedUrl(path, 3600)
            return { path, url: signed?.signedUrl || '' }
          })
        )
        setOriginals(urls.filter(u => u.url))
      }
      setLoading(false)
    })
  }, [params.id, router])

  const updateStatus = async (status: string) => {
    const sb = createClient()
    await sb.from('orders').update({ status, updated_at: new Date().toISOString() }).eq('id', order.id)
    if (status === 'ready_for_review') {
      await sb.from('notifications').insert({
        user_id: order.customer_id, order_id: order.id,
        type: 'order_ready',
        message: `Your order #${order.id.slice(0,8)} is ready for review!`,
      })
    }
    setOrder({ ...order, status })
    setNewStatus(status)
  }

  const assignTeam = async (userId: string) => {
    const sb = createClient()
    await sb.from('orders').update({ assigned_to: userId || null }).eq('id', order.id)
    setOrder({ ...order, assigned_to: userId })
  }

  const downloadAll = () => {
    originals.forEach(({ url, path }, i) => {
      setTimeout(() => {
        const a = document.createElement('a')
        a.href = url
        a.download = path.split('/').pop() || `photo_${i+1}.jpg`
        a.target = '_blank'
        a.click()
      }, i * 400)
    })
  }

  const uploadCompleted = async () => {
    if (!files.length) return
    setUploading(true); setUploadError('')
    const sb = createClient()
    try {
      const paths: string[] = []
      for (let i = 0; i < files.length; i++) {
        const f    = files[i]
        const path = `${order.customer_id}/${order.id}/completed_${i}_${f.name.replace(/[^a-zA-Z0-9._-]/g,'_')}`
        const { error } = await sb.storage.from('completed').upload(path, f, { upsert: true })
        if (error) throw new Error(error.message)
        paths.push(path)
        setProgress(Math.round(((i+1)/files.length)*100))
      }
      await sb.from('orders').update({
        completed_urls: paths,
        status: 'ready_for_review',
        updated_at: new Date().toISOString(),
      }).eq('id', order.id)
      await sb.from('notifications').insert({
        user_id: order.customer_id, order_id: order.id,
        type: 'order_ready',
        message: `Your order #${order.id.slice(0,8)} is ready for review!`,
      })
      setOrder({ ...order, completed_urls: paths, status: 'ready_for_review' })
      setNewStatus('ready_for_review')
      setFiles([])
      alert(`✅ ${paths.length} photos uploaded! Customer has been notified.`)
    } catch(e:any) {
      setUploadError(e.message)
    }
    setUploading(false)
  }

  const sendMessage = async () => {
    if (!newMessage.trim()) return
    const sb = createClient()
    const { data } = await sb.from('messages').insert({
      order_id: order.id, sender_id: profile.id, role: profile.role, content: newMessage
    }).select().single()
    if (data) setMessages(prev => [...prev, data])
    setNewMessage('')
  }

  if (loading) return <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:'100vh',fontFamily:'Inter,sans-serif',color:'#6b7280'}}>Loading...</div>
  if (!order)  return <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:'100vh'}}>Order not found</div>

  const customer  = order.profiles as any
  const sc        = STATUS_COLORS[order.status] || STATUS_COLORS.pending

  return (
    <div style={{fontFamily:"'Inter',sans-serif",background:'#f9fafb',minHeight:'100vh'}}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap'); *{box-sizing:border-box;}`}</style>
      <Sidebar role={profile?.role||'admin'} active="/admin/orders" userName={profile?.full_name} />
      <main style={{marginLeft:240,padding:'40px 48px'}}>
        <div style={{maxWidth:960}}>

          <Link href="/admin/orders" style={{fontSize:13,color:'#6b7280',textDecoration:'none',marginBottom:16,display:'inline-block'}}>← All Orders</Link>

          {/* Header */}
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:24}}>
            <div>
              <h1 style={{fontSize:24,fontWeight:800,color:'#111',letterSpacing:'-0.5px'}}>Order #{order.id.slice(0,8)}</h1>
              <p style={{fontSize:14,color:'#6b7280',marginTop:4}}>
                {customer?.full_name || customer?.email || '—'} • {order.image_count} photos • {order.service_type?.replace(/_/g,' ')}
              </p>
            </div>
            <span style={{padding:'8px 16px',borderRadius:100,fontSize:13,fontWeight:700,background:sc.bg,color:sc.color}}>
              {STATUS_LABELS[order.status]}
            </span>
          </div>

          <div style={{display:'grid',gridTemplateColumns:'1fr 320px',gap:20}}>
            <div>

              {/* Status + assign */}
              <div style={{background:'#fff',borderRadius:12,border:'1px solid #e5e7eb',padding:24,marginBottom:20}}>
                <h3 style={{fontSize:15,fontWeight:700,color:'#111',marginBottom:16}}>Manage Order</h3>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:16}}>
                  <div>
                    <label style={{fontSize:12,fontWeight:600,color:'#6b7280',display:'block',marginBottom:6,textTransform:'uppercase',letterSpacing:'0.5px'}}>Status</label>
                    <select value={newStatus} onChange={e => updateStatus(e.target.value)} style={{width:'100%',padding:'9px 12px',border:'1.5px solid #d1d5db',borderRadius:8,fontSize:14,fontWeight:600,outline:'none',cursor:'pointer',background:'#fff'}}>
                      {STATUSES.map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{fontSize:12,fontWeight:600,color:'#6b7280',display:'block',marginBottom:6,textTransform:'uppercase',letterSpacing:'0.5px'}}>Assign To</label>
                    <select value={order.assigned_to||''} onChange={e => assignTeam(e.target.value)} style={{width:'100%',padding:'9px 12px',border:'1.5px solid #d1d5db',borderRadius:8,fontSize:14,outline:'none',cursor:'pointer',background:'#fff'}}>
                      <option value="">Unassigned</option>
                      {teamMembers.map(t => <option key={t.id} value={t.id}>{t.full_name}</option>)}
                    </select>
                  </div>
                </div>
                {order.notes && (
                  <div style={{background:'#f9fafb',borderRadius:8,padding:'12px 14px'}}>
                    <div style={{fontSize:12,fontWeight:600,color:'#6b7280',marginBottom:4}}>CUSTOMER INSTRUCTIONS</div>
                    <p style={{fontSize:14,color:'#374151',margin:0}}>{order.notes}</p>
                  </div>
                )}
                {order.customer_feedback && (
                  <div style={{background:'#fce7f3',border:'1px solid #f9a8d4',borderRadius:8,padding:'12px 14px',marginTop:12}}>
                    <div style={{fontSize:12,fontWeight:600,color:'#be185d',marginBottom:4}}>↩ REVISION REQUEST</div>
                    <p style={{fontSize:14,color:'#9d174d',margin:0}}>{order.customer_feedback}</p>
                  </div>
                )}
              </div>

              {/* Original photos — admin can see + download */}
              <div style={{background:'#fff',borderRadius:12,border:'1px solid #e5e7eb',padding:24,marginBottom:20}}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
                  <div>
                    <h3 style={{fontSize:15,fontWeight:700,color:'#111',margin:0}}>📥 Original Photos</h3>
                    <p style={{fontSize:13,color:'#6b7280',margin:'4px 0 0'}}>Uploaded by customer — {originals.length} file{originals.length !== 1 ? 's' : ''}</p>
                  </div>
                  {originals.length > 0 && (
                    <button onClick={downloadAll} style={{background:'#111',color:'#fff',padding:'9px 18px',borderRadius:8,fontSize:13,fontWeight:700,border:'none',cursor:'pointer'}}>
                      ↓ Download All
                    </button>
                  )}
                </div>
                {originals.length === 0 ? (
                  <p style={{fontSize:14,color:'#9ca3af',textAlign:'center',padding:'20px 0'}}>No photos uploaded yet</p>
                ) : (
                  <div style={{display:'grid',gridTemplateColumns:'repeat(5,1fr)',gap:8}}>
                    {originals.map(({url, path}, i) => (
                      <a key={i} href={url} download={path.split('/').pop()} target="_blank" rel="noreferrer"
                        style={{display:'block',borderRadius:8,overflow:'hidden',border:'1px solid #e5e7eb',aspectRatio:'1',background:'#f9fafb',position:'relative'}}>
                        <img src={url} alt={`Photo ${i+1}`} style={{width:'100%',height:'100%',objectFit:'cover'}} />
                        <div style={{position:'absolute',bottom:0,left:0,right:0,background:'rgba(0,0,0,0.5)',color:'#fff',fontSize:10,padding:'3px 5px',textAlign:'center'}}>↓ Download</div>
                      </a>
                    ))}
                  </div>
                )}
              </div>

              {/* Upload completed photos */}
              <div style={{background:'#fff',borderRadius:12,border:'1px solid #e5e7eb',padding:24,marginBottom:20}}>
                <h3 style={{fontSize:15,fontWeight:700,color:'#111',marginBottom:4}}>📤 Upload Completed Photos</h3>
                <p style={{fontSize:13,color:'#6b7280',marginBottom:16}}>After processing, upload here. Customer will be notified automatically.</p>

                <div
                  onDrop={e => {e.preventDefault();setDragOver(false);const f=Array.from(e.dataTransfer.files).filter(f=>f.type.startsWith('image/'));setFiles(prev=>[...prev,...f])}}
                  onDragOver={e=>{e.preventDefault();setDragOver(true)}}
                  onDragLeave={()=>setDragOver(false)}
                  onClick={()=>document.getElementById('completed-input')?.click()}
                  style={{border:`2px dashed ${dragOver?'#2563eb':'#d1d5db'}`,borderRadius:10,padding:32,textAlign:'center',cursor:'pointer',background:dragOver?'#eff6ff':'#f9fafb',marginBottom:12}}
                >
                  <input id="completed-input" type="file" multiple accept="image/*" style={{display:'none'}}
                    onChange={e=>{const f=Array.from(e.target.files||[]).filter(f=>f.type.startsWith('image/'));setFiles(prev=>[...prev,...f])}} />
                  <div style={{fontSize:28,marginBottom:8}}>📁</div>
                  <div style={{fontSize:14,fontWeight:600,color:'#111'}}>{files.length>0?`${files.length} files selected — click to add more`:'Drop completed photos here or click to browse'}</div>
                </div>

                {uploading && (
                  <div style={{marginBottom:12}}>
                    <div style={{display:'flex',justifyContent:'space-between',marginBottom:6}}>
                      <span style={{fontSize:13,fontWeight:600}}>Uploading...</span>
                      <span style={{fontSize:13,color:'#2563eb',fontWeight:700}}>{progress}%</span>
                    </div>
                    <div style={{background:'#f3f4f6',borderRadius:100,height:8}}>
                      <div style={{background:'#2563eb',height:8,borderRadius:100,width:`${progress}%`,transition:'width 0.3s'}} />
                    </div>
                  </div>
                )}

                {uploadError && <p style={{color:'#dc2626',fontSize:13,marginBottom:10}}>⚠️ {uploadError}</p>}

                {files.length > 0 && !uploading && (
                  <div style={{display:'flex',gap:10,alignItems:'center',marginBottom:12}}>
                    <span style={{fontSize:13,color:'#111',fontWeight:600}}>{files.length} photos ready to upload</span>
                    <button onClick={()=>setFiles([])} style={{fontSize:12,color:'#ef4444',background:'none',border:'none',cursor:'pointer'}}>Clear</button>
                  </div>
                )}

                <button onClick={uploadCompleted} disabled={!files.length||uploading} style={{width:'100%',background:files.length&&!uploading?'#2563eb':'#d1d5db',color:'#fff',padding:12,borderRadius:8,fontSize:14,fontWeight:700,border:'none',cursor:files.length&&!uploading?'pointer':'not-allowed'}}>
                  {uploading?`Uploading ${progress}%...`:`Upload & Notify Customer (${files.length} files)`}
                </button>

                {order.completed_urls?.length>0 && (
                  <div style={{marginTop:12,padding:'10px 14px',background:'#dcfce7',borderRadius:8,fontSize:13,color:'#16a34a',fontWeight:600}}>
                    ✓ {order.completed_urls.length} completed photos already uploaded
                  </div>
                )}
              </div>

            </div>

            {/* Messages sidebar */}
            <div>
              <div style={{background:'#fff',borderRadius:12,border:'1px solid #e5e7eb',position:'sticky',top:20}}>
                <div style={{padding:'16px 20px',borderBottom:'1px solid #f3f4f6'}}>
                  <h3 style={{fontSize:14,fontWeight:700,color:'#111',margin:0}}>Messages</h3>
                </div>
                <div style={{padding:16,maxHeight:400,overflowY:'auto',display:'flex',flexDirection:'column',gap:10}}>
                  {messages.length===0 ? (
                    <p style={{fontSize:13,color:'#9ca3af',textAlign:'center',padding:'20px 0'}}>No messages yet</p>
                  ) : messages.map(m => (
                    <div key={m.id} style={{padding:'10px 12px',borderRadius:8,background:m.role==='customer'?'#f9fafb':'#eff6ff',border:'1px solid',borderColor:m.role==='customer'?'#e5e7eb':'#bfdbfe'}}>
                      <div style={{fontSize:10,fontWeight:700,color:'#9ca3af',textTransform:'uppercase',marginBottom:4}}>{m.role}</div>
                      <div style={{fontSize:13,color:'#111',lineHeight:1.5}}>{m.content}</div>
                    </div>
                  ))}
                </div>
                <div style={{padding:'12px 16px',borderTop:'1px solid #f3f4f6',display:'flex',gap:8}}>
                  <input value={newMessage} onChange={e=>setNewMessage(e.target.value)} onKeyDown={e=>e.key==='Enter'&&sendMessage()} placeholder="Reply..." style={{flex:1,padding:'8px 12px',border:'1.5px solid #d1d5db',borderRadius:7,fontSize:13,outline:'none'}} />
                  <button onClick={sendMessage} style={{background:'#2563eb',color:'#fff',padding:'8px 12px',borderRadius:7,fontSize:13,fontWeight:700,border:'none',cursor:'pointer'}}>Send</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
