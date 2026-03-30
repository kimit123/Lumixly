'use client'
import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'

const CROP_TYPES = [
  { id: 'headless', label: 'Headless', desc: 'Removes face at lip line — most popular for fashion' },
  { id: 'full_body', label: 'Full Body', desc: 'Head to toe — keeps everything' },
  { id: 'upper_half', label: 'Upper Half', desc: 'Head to waist — for tops and jackets' },
  { id: 'head_knees', label: 'Head to Knees', desc: 'Perfect for dresses and skirts' },
  { id: 'no_crop', label: 'No Crop', desc: 'Background removal only' },
  { id: 'closer', label: 'Closer Shot', desc: 'Detail and close-up photos' },
  { id: 'product', label: 'Product Only', desc: 'Bags, shoes, accessories' },
]

function Sidebar({ active }: { active: string }) {
  const router = useRouter()
  const links = [
    { href: '/dashboard', label: 'Dashboard', icon: '⊞' },
    { href: '/upload', label: 'Upload Photos', icon: '↑' },
    { href: '/orders', label: 'My Orders', icon: '📋' },
    { href: '/billing', label: 'Billing', icon: '💳' },
  ]
  return (
    <aside style={{ width: 240, background: '#fff', borderRight: '1px solid #e5e7eb', height: '100vh', position: 'fixed', left: 0, top: 0, display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '20px 24px', borderBottom: '1px solid #f3f4f6' }}>
        <Link href="/" style={{ fontSize: 18, fontWeight: 800, color: '#111', textDecoration: 'none' }}>Lumixly</Link>
      </div>
      <nav style={{ flex: 1, padding: '16px 12px' }}>
        {links.map(l => (
          <Link key={l.href} href={l.href} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', borderRadius: 8, marginBottom: 2, fontSize: 14, fontWeight: active === l.href ? 600 : 400, color: active === l.href ? '#2563eb' : '#6b7280', background: active === l.href ? '#eff6ff' : 'transparent', textDecoration: 'none' }}>
            <span style={{ fontSize: 16 }}>{l.icon}</span> {l.label}
          </Link>
        ))}
      </nav>
    </aside>
  )
}

export default function UploadPage() {
  const [files, setFiles] = useState<File[]>([])
  const [cropType, setCropType] = useState('headless')
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [dragOver, setDragOver] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  const handleFiles = useCallback((newFiles: FileList | null) => {
    if (!newFiles) return
    const valid = Array.from(newFiles).filter(f => f.type.startsWith('image/'))
    setFiles(prev => [...prev, ...valid].slice(0, 1000))
  }, [])

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); setDragOver(false)
    handleFiles(e.dataTransfer.files)
  }

  const handleSubmit = async () => {
    if (!files.length) return
    setUploading(true); setError('')
    const sb = createClient()
    const { data: { user } } = await sb.auth.getUser()
    if (!user) { router.push('/auth/login'); return }
    try {
      const { data: order, error: oErr } = await sb.from('orders').insert({ user_id: user.id, status: 'pending', image_count: files.length, crop_type: cropType }).select().single()
      if (oErr) throw oErr
      const paths: string[] = []
      for (let i = 0; i < files.length; i++) {
        const f = files[i]
        const path = `${user.id}/${order.id}/${f.name}`
        const { error: upErr } = await sb.storage.from('uploads').upload(path, f)
        if (upErr) throw upErr
        paths.push(path)
        setProgress(Math.round(((i + 1) / files.length) * 100))
      }
      await fetch('/api/process', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ orderId: order.id, cropType, paths }) })
      router.push(`/orders/${order.id}`)
    } catch (e: any) { setError(e.message || 'Upload failed'); setUploading(false) }
  }

  return (
    <div style={{ fontFamily: "'Inter', sans-serif", background: '#f9fafb', minHeight: '100vh' }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap'); * { box-sizing: border-box; }`}</style>
      <Sidebar active="/upload" />
      <main style={{ marginLeft: 240, padding: '40px 48px' }}>
        <div style={{ maxWidth: 800 }}>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: '#111', letterSpacing: '-0.5px', marginBottom: 6 }}>Upload Photos</h1>
          <p style={{ fontSize: 14, color: '#6b7280', marginBottom: 36 }}>Upload up to 1,000 photos at once</p>

          {/* Crop type */}
          <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e5e7eb', padding: 24, marginBottom: 20 }}>
            <h2 style={{ fontSize: 15, fontWeight: 700, color: '#111', marginBottom: 16 }}>Select crop type</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
              {CROP_TYPES.map(ct => (
                <button key={ct.id} onClick={() => setCropType(ct.id)} style={{ textAlign: 'left', padding: '12px 14px', borderRadius: 8, border: `2px solid ${cropType === ct.id ? '#2563eb' : '#e5e7eb'}`, background: cropType === ct.id ? '#eff6ff' : '#fff', cursor: 'pointer', transition: 'all 0.15s' }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: cropType === ct.id ? '#2563eb' : '#111' }}>{ct.label}</div>
                  <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>{ct.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Dropzone */}
          <div
            onDrop={handleDrop}
            onDragOver={e => { e.preventDefault(); setDragOver(true) }}
            onDragLeave={() => setDragOver(false)}
            onClick={() => document.getElementById('file-input')?.click()}
            style={{ border: `2px dashed ${dragOver ? '#2563eb' : '#d1d5db'}`, borderRadius: 12, padding: '56px 32px', textAlign: 'center', cursor: 'pointer', background: dragOver ? '#eff6ff' : '#fff', transition: 'all 0.15s', marginBottom: 20 }}
          >
            <input id="file-input" type="file" multiple accept="image/*" style={{ display: 'none' }} onChange={e => handleFiles(e.target.files)} />
            <div style={{ fontSize: 40, marginBottom: 12 }}>📁</div>
            <p style={{ fontSize: 16, fontWeight: 600, color: '#111', marginBottom: 6 }}>Drop photos here or click to browse</p>
            <p style={{ fontSize: 14, color: '#9ca3af' }}>JPG, PNG, WEBP • Up to 1,000 photos at once</p>
          </div>

          {/* File count */}
          {files.length > 0 && (
            <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e5e7eb', padding: '16px 20px', marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 14, fontWeight: 600, color: '#111' }}>📸 {files.length} photo{files.length !== 1 ? 's' : ''} selected</span>
              <button onClick={() => setFiles([])} style={{ fontSize: 13, color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 500 }}>Clear all</button>
            </div>
          )}

          {/* Progress */}
          {uploading && (
            <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e5e7eb', padding: 20, marginBottom: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontSize: 14, fontWeight: 600, color: '#111' }}>Uploading photos...</span>
                <span style={{ fontSize: 14, fontWeight: 700, color: '#2563eb' }}>{progress}%</span>
              </div>
              <div style={{ background: '#f3f4f6', borderRadius: 100, height: 6 }}>
                <div style={{ background: '#2563eb', height: 6, borderRadius: 100, width: `${progress}%`, transition: 'width 0.3s' }} />
              </div>
            </div>
          )}

          {error && <div style={{ background: '#fee2e2', border: '1px solid #fca5a5', borderRadius: 8, padding: '12px 16px', color: '#dc2626', fontSize: 14, marginBottom: 20 }}>{error}</div>}

          <button onClick={handleSubmit} disabled={!files.length || uploading} style={{ width: '100%', background: files.length && !uploading ? '#2563eb' : '#d1d5db', color: '#fff', padding: '16px', borderRadius: 10, fontSize: 16, fontWeight: 700, border: 'none', cursor: files.length && !uploading ? 'pointer' : 'not-allowed', transition: 'background 0.15s' }}>
            {uploading ? `Uploading... ${progress}%` : `Process ${files.length || 0} photos →`}
          </button>
        </div>
      </main>
    </div>
  )
}
