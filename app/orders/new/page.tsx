'use client'
import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Sidebar from '@/components/Sidebar'
import { createClient } from '@/lib/supabase'

const SERVICES = [
  { id: 'headless', label: 'Headless Crop', desc: 'Remove face at lip line — most popular for fashion', icon: '✂️', price: 0.50 },
  { id: 'full_body', label: 'Full Body', desc: 'Head to toe with background removed', icon: '👗', price: 0.40 },
  { id: 'upper_half', label: 'Upper Half', desc: 'Head to waist — tops, jackets, shirts', icon: '👕', price: 0.40 },
  { id: 'head_knees', label: 'Head to Knees', desc: 'Perfect for dresses and skirts', icon: '👘', price: 0.40 },
  { id: 'background_only', label: 'Background Only', desc: 'Remove background, keep full image', icon: '🪄', price: 0.30 },
  { id: 'product', label: 'Product Shot', desc: 'Bags, shoes, accessories — centred & clean', icon: '👜', price: 0.35 },
]

export default function NewOrderPage() {
  const [step, setStep] = useState(1)
  const [service, setService] = useState('')
  const [notes, setNotes] = useState('')
  const [files, setFiles] = useState<File[]>([])
  const [dragOver, setDragOver] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState('')
  const router = useRouter()

  const selectedService = SERVICES.find(s => s.id === service)

  const handleFiles = useCallback((newFiles: FileList | null) => {
    if (!newFiles) return
    const valid = Array.from(newFiles).filter(f => f.type.startsWith('image/'))
    setFiles(prev => [...prev, ...valid].slice(0, 500))
  }, [])

  const handleSubmit = async () => {
    if (!files.length || !service) return
    setUploading(true); setError('')
    const sb = createClient()
    const { data: { user } } = await sb.auth.getUser()
    if (!user) { router.push('/auth/login'); return }

    try {
      // Create order
      const { data: order, error: oErr } = await sb.from('orders').insert({
        customer_id: user.id,
        status: 'pending',
        service_type: service,
        image_count: files.length,
        notes,
        price: (selectedService?.price || 0.40) * files.length,
      }).select().single()
      if (oErr) throw oErr

      // Upload files to Supabase storage
      const uploadedUrls: string[] = []
      for (let i = 0; i < files.length; i++) {
        const f = files[i]
        const path = `${user.id}/${order.id}/${Date.now()}_${f.name}`
        const { error: upErr } = await sb.storage.from('originals').upload(path, f)
        if (upErr) throw upErr
        const { data: urlData } = sb.storage.from('originals').getPublicUrl(path)
        uploadedUrls.push(path)
        setProgress(Math.round(((i + 1) / files.length) * 100))
      }

      // Update order with file paths
      await sb.from('orders').update({ original_urls: uploadedUrls }).eq('id', order.id)

      // Notify admin (create notification for all admins)
      await sb.from('notifications').insert({
        order_id: order.id,
        type: 'new_order',
        message: `New order #${order.id.slice(0, 8)} — ${files.length} photos — ${service.replace(/_/g, ' ')}`,
      })

      router.push(`/orders/${order.id}?success=1`)
    } catch (e: any) {
      setError(e.message || 'Upload failed')
      setUploading(false)
    }
  }

  return (
    <div style={{ fontFamily: "'Inter', sans-serif", background: '#f9fafb', minHeight: '100vh' }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap'); * { box-sizing: border-box; }`}</style>
      <Sidebar role="customer" active="/orders/new" />
      <main style={{ marginLeft: 240, padding: '40px 48px' }}>
        <div style={{ maxWidth: 720 }}>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: '#111', letterSpacing: '-0.5px', marginBottom: 6 }}>New Order</h1>
          <p style={{ fontSize: 14, color: '#6b7280', marginBottom: 32 }}>Upload your photos and we'll take care of the rest</p>

          {/* Steps indicator */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 36 }}>
            {['Choose Service', 'Upload Photos', 'Confirm'].map((s, i) => (
              <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 14px', borderRadius: 100, background: step === i + 1 ? '#2563eb' : step > i + 1 ? '#dcfce7' : '#f3f4f6', color: step === i + 1 ? '#fff' : step > i + 1 ? '#16a34a' : '#9ca3af', fontSize: 13, fontWeight: 600 }}>
                  <span style={{ width: 20, height: 20, borderRadius: '50%', background: step === i + 1 ? 'rgba(255,255,255,0.2)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11 }}>
                    {step > i + 1 ? '✓' : i + 1}
                  </span>
                  {s}
                </div>
                {i < 2 && <div style={{ width: 32, height: 1, background: '#e5e7eb' }} />}
              </div>
            ))}
          </div>

          {/* Step 1: Choose service */}
          {step === 1 && (
            <div>
              <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e5e7eb', padding: 24, marginBottom: 20 }}>
                <h2 style={{ fontSize: 16, fontWeight: 700, color: '#111', marginBottom: 16 }}>What service do you need?</h2>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  {SERVICES.map(s => (
                    <button key={s.id} onClick={() => setService(s.id)} style={{ textAlign: 'left', padding: '16px', borderRadius: 10, border: `2px solid ${service === s.id ? '#2563eb' : '#e5e7eb'}`, background: service === s.id ? '#eff6ff' : '#fff', cursor: 'pointer', transition: 'all 0.15s' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <span style={{ fontSize: 24 }}>{s.icon}</span>
                        <span style={{ fontSize: 12, fontWeight: 700, color: service === s.id ? '#2563eb' : '#6b7280' }}>£{s.price}/img</span>
                      </div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: service === s.id ? '#2563eb' : '#111', marginTop: 8 }}>{s.label}</div>
                      <div style={{ fontSize: 12, color: '#6b7280', marginTop: 4, lineHeight: 1.5 }}>{s.desc}</div>
                    </button>
                  ))}
                </div>
              </div>
              <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e5e7eb', padding: 20, marginBottom: 20 }}>
                <h3 style={{ fontSize: 14, fontWeight: 700, color: '#111', marginBottom: 10 }}>Special instructions (optional)</h3>
                <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="e.g. Please keep the shadow, or specific cropping instructions..." style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #d1d5db', borderRadius: 8, fontSize: 14, resize: 'vertical', minHeight: 80, outline: 'none', fontFamily: 'Inter, sans-serif', color: '#111' }} />
              </div>
              <button onClick={() => setStep(2)} disabled={!service} style={{ width: '100%', background: service ? '#2563eb' : '#d1d5db', color: '#fff', padding: 14, borderRadius: 10, fontSize: 15, fontWeight: 700, border: 'none', cursor: service ? 'pointer' : 'not-allowed' }}>
                Continue → Upload Photos
              </button>
            </div>
          )}

          {/* Step 2: Upload photos */}
          {step === 2 && (
            <div>
              <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e5e7eb', padding: 20, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: 24 }}>{selectedService?.icon}</span>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#111' }}>{selectedService?.label}</div>
                  <div style={{ fontSize: 13, color: '#6b7280' }}>£{selectedService?.price} per image</div>
                </div>
                <button onClick={() => setStep(1)} style={{ marginLeft: 'auto', fontSize: 12, color: '#2563eb', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 500 }}>Change</button>
              </div>

              <div
                onDrop={e => { e.preventDefault(); setDragOver(false); handleFiles(e.dataTransfer.files) }}
                onDragOver={e => { e.preventDefault(); setDragOver(true) }}
                onDragLeave={() => setDragOver(false)}
                onClick={() => document.getElementById('file-input')?.click()}
                style={{ border: `2px dashed ${dragOver ? '#2563eb' : '#d1d5db'}`, borderRadius: 12, padding: '48px', textAlign: 'center', cursor: 'pointer', background: dragOver ? '#eff6ff' : '#fff', transition: 'all 0.15s', marginBottom: 16 }}
              >
                <input id="file-input" type="file" multiple accept="image/*" style={{ display: 'none' }} onChange={e => handleFiles(e.target.files)} />
                <div style={{ fontSize: 36, marginBottom: 12 }}>📁</div>
                <div style={{ fontSize: 15, fontWeight: 600, color: '#111', marginBottom: 4 }}>Drop photos here or click to browse</div>
                <div style={{ fontSize: 13, color: '#9ca3af' }}>JPG, PNG, WEBP • Up to 500 photos</div>
              </div>

              {files.length > 0 && (
                <div style={{ background: '#fff', borderRadius: 10, border: '1px solid #e5e7eb', padding: '14px 18px', marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 14, fontWeight: 600, color: '#111' }}>📸 {files.length} photo{files.length > 1 ? 's' : ''} selected</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <span style={{ fontSize: 13, color: '#2563eb', fontWeight: 700 }}>Est. £{((selectedService?.price || 0.4) * files.length).toFixed(2)}</span>
                    <button onClick={() => setFiles([])} style={{ fontSize: 13, color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer' }}>Clear</button>
                  </div>
                </div>
              )}

              {uploading && (
                <div style={{ background: '#fff', borderRadius: 10, border: '1px solid #e5e7eb', padding: 18, marginBottom: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <span style={{ fontSize: 14, fontWeight: 600 }}>Uploading...</span>
                    <span style={{ fontSize: 14, fontWeight: 700, color: '#2563eb' }}>{progress}%</span>
                  </div>
                  <div style={{ background: '#f3f4f6', borderRadius: 100, height: 6 }}>
                    <div style={{ background: '#2563eb', height: 6, borderRadius: 100, width: `${progress}%`, transition: 'width 0.3s' }} />
                  </div>
                </div>
              )}

              {error && <div style={{ background: '#fee2e2', border: '1px solid #fca5a5', borderRadius: 8, padding: '12px 16px', color: '#dc2626', fontSize: 14, marginBottom: 16 }}>{error}</div>}

              <div style={{ display: 'flex', gap: 12 }}>
                <button onClick={() => setStep(1)} style={{ flex: 0, padding: '13px 20px', borderRadius: 10, border: '1.5px solid #d1d5db', background: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer', color: '#374151' }}>← Back</button>
                <button onClick={() => setStep(3)} disabled={!files.length} style={{ flex: 1, background: files.length ? '#2563eb' : '#d1d5db', color: '#fff', padding: 13, borderRadius: 10, fontSize: 15, fontWeight: 700, border: 'none', cursor: files.length ? 'pointer' : 'not-allowed' }}>
                  Review & Confirm →
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Confirm */}
          {step === 3 && (
            <div>
              <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e5e7eb', padding: 28, marginBottom: 20 }}>
                <h2 style={{ fontSize: 16, fontWeight: 700, color: '#111', marginBottom: 20 }}>Order Summary</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 14, color: '#6b7280' }}>Service</span>
                    <span style={{ fontSize: 14, fontWeight: 600, color: '#111' }}>{selectedService?.label}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 14, color: '#6b7280' }}>Photos</span>
                    <span style={{ fontSize: 14, fontWeight: 600, color: '#111' }}>{files.length} images</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 14, color: '#6b7280' }}>Price per image</span>
                    <span style={{ fontSize: 14, fontWeight: 600, color: '#111' }}>£{selectedService?.price}</span>
                  </div>
                  {notes && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <span style={{ fontSize: 14, color: '#6b7280' }}>Notes</span>
                      <span style={{ fontSize: 13, color: '#374151', maxWidth: 300, textAlign: 'right' }}>{notes}</span>
                    </div>
                  )}
                  <div style={{ borderTop: '1px solid #f3f4f6', paddingTop: 14, display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 16, fontWeight: 700, color: '#111' }}>Estimated Total</span>
                    <span style={{ fontSize: 20, fontWeight: 800, color: '#2563eb' }}>£{((selectedService?.price || 0.4) * files.length).toFixed(2)}</span>
                  </div>
                </div>
              </div>

              <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 10, padding: '14px 18px', marginBottom: 20, fontSize: 13, color: '#92400e' }}>
                💡 After placing your order, our team will process your photos and notify you when they're ready to review. Typical turnaround: 24–48 hours.
              </div>

              <div style={{ display: 'flex', gap: 12 }}>
                <button onClick={() => setStep(2)} style={{ flex: 0, padding: '13px 20px', borderRadius: 10, border: '1.5px solid #d1d5db', background: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer', color: '#374151' }}>← Back</button>
                <button onClick={handleSubmit} disabled={uploading} style={{ flex: 1, background: uploading ? '#93c5fd' : '#2563eb', color: '#fff', padding: 13, borderRadius: 10, fontSize: 15, fontWeight: 700, border: 'none', cursor: uploading ? 'not-allowed' : 'pointer' }}>
                  {uploading ? `Uploading ${progress}%...` : 'Place Order →'}
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
