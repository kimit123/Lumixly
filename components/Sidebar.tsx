'use client'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

interface SidebarProps {
  role: 'customer' | 'admin' | 'team'
  active: string
  userName?: string
  plan?: string
}

const CUSTOMER_LINKS = [
  { href: '/dashboard', label: 'Dashboard', icon: '⊞' },
  { href: '/orders/new', label: 'New Order', icon: '+' },
  { href: '/orders', label: 'My Orders', icon: '📋' },
  { href: '/billing', label: 'Billing', icon: '💳' },
]

const ADMIN_LINKS = [
  { href: '/admin', label: 'Overview', icon: '⊞' },
  { href: '/admin/orders', label: 'All Orders', icon: '📋' },
  { href: '/admin/customers', label: 'Customers', icon: '👥' },
  { href: '/admin/team', label: 'Team', icon: '🛠️' },
  { href: '/admin/upload', label: 'Upload Completed', icon: '↑' },
]

const TEAM_LINKS = [
  { href: '/team', label: 'My Orders', icon: '📋' },
  { href: '/team/upload', label: 'Upload Completed', icon: '↑' },
]

export default function Sidebar({ role, active, userName, plan }: SidebarProps) {
  const router = useRouter()
  const isAdmin = role === 'admin'
  const links = role === 'customer' ? CUSTOMER_LINKS : role === 'admin' ? ADMIN_LINKS : TEAM_LINKS

  const handleSignOut = async () => {
    const sb = createClient()
    await sb.auth.signOut()
    router.push('/')
  }

  return (
    <aside style={{
      width: 240,
      background: isAdmin ? '#111' : '#fff',
      borderRight: isAdmin ? 'none' : '1px solid #e5e7eb',
      height: '100vh',
      position: 'fixed',
      left: 0,
      top: 0,
      display: 'flex',
      flexDirection: 'column',
      zIndex: 10,
      fontFamily: 'Inter, sans-serif',
    }}>
      {/* Logo */}
      <div style={{ padding: '20px 24px', borderBottom: `1px solid ${isAdmin ? 'rgba(255,255,255,0.08)' : '#f3f4f6'}` }}>
        <Link href="/" style={{ fontSize: 18, fontWeight: 800, color: isAdmin ? '#fff' : '#111', textDecoration: 'none', letterSpacing: '-0.5px' }}>
          Lumixly
        </Link>
        {isAdmin && <div style={{ fontSize: 10, color: '#6b7280', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1.5px', marginTop: 2 }}>Admin Panel</div>}
        {role === 'team' && <div style={{ fontSize: 10, color: '#6b7280', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1.5px', marginTop: 2 }}>Team View</div>}
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '16px 12px', overflowY: 'auto' }}>
        {links.map(l => {
          const isActive = active === l.href
          return (
            <Link key={l.href} href={l.href} style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '9px 12px', borderRadius: 8, marginBottom: 2,
              fontSize: 14, fontWeight: isActive ? 600 : 400,
              color: isActive ? (isAdmin ? '#fff' : '#2563eb') : (isAdmin ? 'rgba(255,255,255,0.5)' : '#6b7280'),
              background: isActive ? (isAdmin ? 'rgba(255,255,255,0.08)' : '#eff6ff') : 'transparent',
              textDecoration: 'none', transition: 'all 0.15s',
            }}>
              <span style={{ fontSize: 15 }}>{l.icon}</span>
              {l.label}
              {l.label === 'New Order' && <span style={{ marginLeft: 'auto', background: '#2563eb', color: '#fff', fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 100 }}>NEW</span>}
            </Link>
          )
        })}
      </nav>

      {/* User info + signout */}
      <div style={{ padding: '16px 20px', borderTop: `1px solid ${isAdmin ? 'rgba(255,255,255,0.08)' : '#f3f4f6'}` }}>
        {userName && (
          <div style={{ marginBottom: 10 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: isAdmin ? '#fff' : '#111', marginBottom: 2 }}>{userName}</div>
            {plan && <div style={{ fontSize: 11, color: isAdmin ? '#6b7280' : '#9ca3af', textTransform: 'capitalize' }}>{plan} plan</div>}
          </div>
        )}
        {isAdmin && (
          <Link href="/dashboard" style={{ display: 'block', fontSize: 12, color: 'rgba(255,255,255,0.4)', textDecoration: 'none', marginBottom: 8 }}>
            ← Customer view
          </Link>
        )}
        <button onClick={handleSignOut} style={{ fontSize: 13, color: isAdmin ? 'rgba(255,255,255,0.4)' : '#9ca3af', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
          Sign out →
        </button>
      </div>
    </aside>
  )
}
