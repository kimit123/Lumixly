'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Sidebar from '@/components/Sidebar'
import { createClient } from '@/lib/supabase'

export default function AdminCustomers() {
  const [customers, setCustomers] = useState<any[]>([])
  const [profile, setProfile] = useState<any>(null)
  const [search, setSearch] = useState('')
  const router = useRouter()

  useEffect(() => {
    const sb = createClient()
    sb.auth.getUser().then(async ({ data }) => {
      if (!data.user) { router.push('/auth/login'); return }
      const pRes = await sb.from('profiles').select('*').eq('id', data.user.id).single()
      if (pRes.data?.role !== 'admin') { router.push('/dashboard'); return }
      setProfile(pRes.data)
      const { data: c } = await sb.from('profiles').select('*').eq('role', 'customer').order('created_at', { ascending: false })
      setCustomers(c || [])
    })
  }, [router])

  const filtered = customers.filter(c => (c.full_name || '').toLowerCase().includes(search.toLowerCase()) || (c.email || '').toLowerCase().includes(search.toLowerCase()))

  return (
    <div style={{ fontFamily: "'Inter',sans-serif", background: '#f9fafb', minHeight: '100vh' }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap'); *{box-sizing:border-box;}`}</style>
      <Sidebar role="admin" active="/admin/customers" userName={profile?.full_name} />
      <main style={{ marginLeft: 240, padding: '40px 48px' }}>
        <div style={{ maxWidth: 960 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
            <div>
              <h1 style={{ fontSize: 24, fontWeight: 800, color: '#111', letterSpacing: '-0.5px' }}>Customers</h1>
              <p style={{ fontSize: 14, color: '#6b7280', marginTop: 4 }}>{customers.length} registered accounts</p>
            </div>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name or email..." style={{ padding: '9px 14px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 14, outline: 'none', width: 250 }} />
          </div>
          <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e5e7eb' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead><tr style={{ background: '#f9fafb' }}>
                {['Customer', 'Email', 'Plan', 'Images Used', 'Joined', 'Orders'].map(h => (
                  <th key={h} style={{ padding: '10px 20px', fontSize: 11, fontWeight: 600, color: '#6b7280', textAlign: 'left', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {filtered.map(c => (
                  <tr key={c.id} style={{ borderTop: '1px solid #f3f4f6' }}>
                    <td style={{ padding: '14px 20px', fontSize: 14, fontWeight: 600, color: '#111' }}>{c.full_name || '—'}</td>
                    <td style={{ padding: '14px 20px', fontSize: 13, color: '#6b7280' }}>{c.email}</td>
                    <td style={{ padding: '14px 20px' }}>
                      <span style={{ padding: '3px 10px', borderRadius: 100, fontSize: 11, fontWeight: 700, background: c.plan === 'pro' ? '#ede9fe' : c.plan === 'starter' ? '#dbeafe' : '#f3f4f6', color: c.plan === 'pro' ? '#7c3aed' : c.plan === 'starter' ? '#2563eb' : '#6b7280', textTransform: 'capitalize' }}>{c.plan || 'free'}</span>
                    </td>
                    <td style={{ padding: '14px 20px', fontSize: 13 }}>{c.credits_used || 0}/{c.credits_limit || 10}</td>
                    <td style={{ padding: '14px 20px', fontSize: 13, color: '#6b7280' }}>{c.created_at ? new Date(c.created_at).toLocaleDateString() : '—'}</td>
                    <td style={{ padding: '14px 20px' }}>
                      <Link href={`/admin/orders?customer=${c.id}`} style={{ fontSize: 13, color: '#2563eb', textDecoration: 'none', fontWeight: 500 }}>View orders →</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  )
}
