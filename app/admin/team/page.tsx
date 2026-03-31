'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Sidebar from '@/components/Sidebar'
import { createClient } from '@/lib/supabase'

export default function AdminTeam() {
  const [team, setTeam] = useState<any[]>([])
  const [profile, setProfile] = useState<any>(null)
  const [showAdd, setShowAdd] = useState(false)
  const [newName, setNewName] = useState('')
  const [newEmail, setNewEmail] = useState('')
  const [newPass, setNewPass] = useState('')
  const [adding, setAdding] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  useEffect(() => {
    const sb = createClient()
    sb.auth.getUser().then(async ({ data }) => {
      if (!data.user) { router.push('/auth/login'); return }
      const pRes = await sb.from('profiles').select('*').eq('id', data.user.id).single()
      if (pRes.data?.role !== 'admin') { router.push('/dashboard'); return }
      setProfile(pRes.data)
      const { data: t } = await sb.from('profiles').select('*').eq('role', 'team').order('created_at', { ascending: false })
      setTeam(t || [])
    })
  }, [router])

  const addTeamMember = async () => {
    if (!newName || !newEmail || !newPass) return
    setAdding(true); setError('')
    const sb = createClient()
    // Create user via admin API (requires service role - for now use signup)
    const { data, error } = await sb.auth.signUp({ email: newEmail, password: newPass, options: { data: { full_name: newName, role: 'team' } } })
    if (error) { setError(error.message); setAdding(false); return }
    // Update role to team
    if (data.user) await sb.from('profiles').update({ role: 'team', full_name: newName }).eq('id', data.user.id)
    setNewName(''); setNewEmail(''); setNewPass(''); setShowAdd(false); setAdding(false)
    window.location.reload()
  }

  return (
    <div style={{ fontFamily: "'Inter',sans-serif", background: '#f9fafb', minHeight: '100vh' }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap'); *{box-sizing:border-box;}`}</style>
      <Sidebar role="admin" active="/admin/team" userName={profile?.full_name} />
      <main style={{ marginLeft: 240, padding: '40px 48px' }}>
        <div style={{ maxWidth: 800 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
            <div>
              <h1 style={{ fontSize: 24, fontWeight: 800, color: '#111', letterSpacing: '-0.5px' }}>Team Members</h1>
              <p style={{ fontSize: 14, color: '#6b7280', marginTop: 4 }}>{team.length} team members</p>
            </div>
            <button onClick={() => setShowAdd(!showAdd)} style={{ background: '#2563eb', color: '#fff', padding: '9px 18px', borderRadius: 8, fontSize: 14, fontWeight: 700, border: 'none', cursor: 'pointer' }}>+ Add Team Member</button>
          </div>

          {showAdd && (
            <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e5e7eb', padding: 24, marginBottom: 20 }}>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: '#111', marginBottom: 16 }}>Add New Team Member</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 12 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: '#6b7280', display: 'block', marginBottom: 6 }}>Full Name</label>
                  <input value={newName} onChange={e => setNewName(e.target.value)} placeholder="John Smith" style={{ width: '100%', padding: '9px 12px', border: '1.5px solid #d1d5db', borderRadius: 8, fontSize: 14, outline: 'none' }} />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: '#6b7280', display: 'block', marginBottom: 6 }}>Email</label>
                  <input type="email" value={newEmail} onChange={e => setNewEmail(e.target.value)} placeholder="john@example.com" style={{ width: '100%', padding: '9px 12px', border: '1.5px solid #d1d5db', borderRadius: 8, fontSize: 14, outline: 'none' }} />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: '#6b7280', display: 'block', marginBottom: 6 }}>Password</label>
                  <input type="password" value={newPass} onChange={e => setNewPass(e.target.value)} placeholder="Min 6 chars" style={{ width: '100%', padding: '9px 12px', border: '1.5px solid #d1d5db', borderRadius: 8, fontSize: 14, outline: 'none' }} />
                </div>
              </div>
              {error && <p style={{ color: '#dc2626', fontSize: 13, marginBottom: 10 }}>{error}</p>}
              <button onClick={addTeamMember} disabled={adding} style={{ background: '#2563eb', color: '#fff', padding: '9px 20px', borderRadius: 8, fontSize: 14, fontWeight: 700, border: 'none', cursor: 'pointer' }}>
                {adding ? 'Adding...' : 'Add Member'}
              </button>
            </div>
          )}

          <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e5e7eb' }}>
            {team.length === 0 ? (
              <div style={{ padding: 48, textAlign: 'center', color: '#9ca3af', fontSize: 14 }}>
                No team members yet. Add your first team member above.
              </div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead><tr style={{ background: '#f9fafb' }}>
                  {['Name', 'Email', 'Joined'].map(h => <th key={h} style={{ padding: '10px 20px', fontSize: 11, fontWeight: 600, color: '#6b7280', textAlign: 'left', textTransform: 'uppercase' }}>{h}</th>)}
                </tr></thead>
                <tbody>
                  {team.map(t => (
                    <tr key={t.id} style={{ borderTop: '1px solid #f3f4f6' }}>
                      <td style={{ padding: '14px 20px', fontSize: 14, fontWeight: 600, color: '#111' }}>{t.full_name}</td>
                      <td style={{ padding: '14px 20px', fontSize: 13, color: '#6b7280' }}>{t.email}</td>
                      <td style={{ padding: '14px 20px', fontSize: 13, color: '#6b7280' }}>{t.created_at ? new Date(t.created_at).toLocaleDateString() : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
