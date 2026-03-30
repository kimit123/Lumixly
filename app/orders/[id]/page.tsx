'use client'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'

function Sidebar({ active }: { active: string }) {
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

export default function OrderPage() {
  const params = useParams()
  const [order, setOrder] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const sb = createClient()
    const fetch = async () => {
      const { data } = await sb.from('orders').select('*').eq('id', params.id).single()
      setOrder(data); setLoading(false)
    }
    fetch()
    const interval = setInterval(async () => {
      const { data } = await sb.from('orders').select('*').eq('id', params.id).single()
      setOrder(data)
      if (data?.status === 'done' || data?.status === 'error') clearInterval(interval)
    }, 3000)
    return () => clearInterval(interval)
  }, [params.id])

  if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', fontFamily: 'Inter, sans-serif', color: '#6b7280' }}>Loading...</div>

  const isDone = order?.status === 'done'
  const isError = order?.status === 'error'
  const isProcessing = !isDone && !isError

  const downloadAll = () => {
    order?.output_urls?.forEach((url: string, i: number) => {
      const a = document.createElement('a'); a.href = url; a.download = `lumixly_${i + 1}.jpg`; a.click()
    })
  }

  return (
    <div style={{ fontFamily: "'Inter', sans-serif", background: '#f9fafb', minHeight: '100vh' }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap'); * { box-sizing: border-box; }`}</style>
      <Sidebar active="/orders" />
      <main style={{ marginLeft: 240, padding: '40px 48px' }}>
        <div style={{ maxWidth: 860 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
            <div>
              <h1 style={{ fontSize: 24, fontWeight: 800, color: '#111', letterSpacing: '-0.5px' }}>Order #{order?.id?.slice(0, 8)}</h1>
              <p style={{ fontSize: 14, color: '#6b7280', marginTop: 4 }}>{order?.image_count} images • {order?.crop_type?.replace('_', ' ')}</p>
            </div>
            <span style={{ padding: '6px 14px', borderRadius: 100, fontSize: 13, fontWeight: 700, background: isDone ? '#dcfce7' : isError ? '#fee2e2' : '#fef9c3', color: isDone ? '#16a34a' : isError ? '#dc2626' : '#92400e' }}>
              {isDone ? '✓ Done' : isError ? '✗ Error' : '⟳ Processing'}
            </span>
          </div>

          <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e5e7eb', padding: 32, marginBottom: 20 }}>
            {isProcessing && (
              <div style={{ textAlign: 'center', padding: '48px 0' }}>
                <div style={{ width: 48, height: 48, border: '4px solid #e5e7eb', borderTopColor: '#2563eb', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 20px' }} />
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                <p style={{ fontSize: 16, fontWeight: 600, color: '#111', marginBottom: 8 }}>Processing your photos...</p>
                <p style={{ fontSize: 14, color: '#6b7280' }}>Usually takes 30–60 seconds per image. This page updates automatically.</p>
              </div>
            )}

            {isError && (
              <div style={{ background: '#fee2e2', border: '1px solid #fca5a5', borderRadius: 8, padding: '14px 18px', color: '#dc2626', fontSize: 14 }}>
                {order?.error_message || 'An error occurred during processing. Please try again.'}
              </div>
            )}

            {isDone && (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                  <p style={{ fontSize: 15, color: '#374151' }}>{order?.output_urls?.length || 0} files ready</p>
                  <button onClick={downloadAll} style={{ background: '#2563eb', color: '#fff', padding: '10px 20px', borderRadius: 8, fontSize: 14, fontWeight: 600, border: 'none', cursor: 'pointer' }}>
                    ↓ Download All
                  </button>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
                  {(order?.output_urls || []).slice(0, 8).map((url: string, i: number) => (
                    <div key={i} style={{ position: 'relative', borderRadius: 8, overflow: 'hidden', border: '1px solid #e5e7eb' }}>
                      <img src={url} alt={`Output ${i + 1}`} style={{ width: '100%', aspectRatio: '1', objectFit: 'cover', display: 'block' }} />
                      <a href={url} download={`lumixly_${i + 1}.jpg`} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0, transition: 'opacity 0.15s', color: '#fff', fontSize: 20, textDecoration: 'none' }}
                        onMouseEnter={e => (e.currentTarget.style.opacity = '1')} onMouseLeave={e => (e.currentTarget.style.opacity = '0')}>↓</a>
                    </div>
                  ))}
                  {(order?.output_urls?.length || 0) > 8 && (
                    <div style={{ background: '#f3f4f6', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', aspectRatio: '1', fontSize: 14, fontWeight: 600, color: '#6b7280' }}>
                      +{order.output_urls.length - 8} more
                    </div>
                  )}
                </div>
              </>
            )}
          </div>

          <div style={{ display: 'flex', gap: 12 }}>
            <Link href="/upload" style={{ flex: 1, background: '#2563eb', color: '#fff', padding: '13px', borderRadius: 8, fontSize: 14, fontWeight: 600, textDecoration: 'none', textAlign: 'center' }}>Upload more photos</Link>
            <Link href="/dashboard" style={{ flex: 1, border: '1.5px solid #d1d5db', color: '#374151', padding: '13px', borderRadius: 8, fontSize: 14, fontWeight: 600, textDecoration: 'none', textAlign: 'center' }}>Back to dashboard</Link>
          </div>
        </div>
      </main>
    </div>
  )
}
