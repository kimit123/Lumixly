'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'
import { Upload, Image, Clock, CreditCard, LogOut, Plus } from 'lucide-react'

interface Order {
  id: string
  created_at: string
  status: 'pending' | 'processing' | 'done' | 'error'
  image_count: number
  crop_type: string
  output_urls: string[]
}

interface UserProfile {
  full_name: string
  plan: string
  credits_used: number
  credits_limit: number
}

export default function DashboardPage() {
  const [user, setUser]       = useState<any>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [orders, setOrders]   = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) { router.push('/auth/login'); return }
      setUser(data.user)
      // Fetch profile
      supabase.from('profiles').select('*').eq('id', data.user.id).single()
        .then(({ data: p }) => setProfile(p))
      // Fetch recent orders
      supabase.from('orders').select('*').eq('user_id', data.user.id)
        .order('created_at', { ascending: false }).limit(10)
        .then(({ data: o }) => setOrders(o || []))
      setLoading(false)
    })
  }, [router])

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
  }

  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-gray-400">Loading...</div>
    </div>
  )

  const creditsPercent = profile ? (profile.credits_used / profile.credits_limit) * 100 : 0

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="fixed left-0 top-0 h-full w-64 bg-white border-r border-gray-100 flex flex-col">
        <div className="p-6 border-b border-gray-100">
          <Link href="/" className="text-xl font-bold text-sky-600">Lumixly</Link>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          <Link href="/dashboard" className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-sky-50 text-sky-700 font-medium text-sm">
            <Image className="w-4 h-4" /> Dashboard
          </Link>
          <Link href="/upload" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-600 hover:bg-gray-50 font-medium text-sm">
            <Upload className="w-4 h-4" /> Upload Photos
          </Link>
          <Link href="/orders" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-600 hover:bg-gray-50 font-medium text-sm">
            <Clock className="w-4 h-4" /> My Orders
          </Link>
          <Link href="/billing" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-600 hover:bg-gray-50 font-medium text-sm">
            <CreditCard className="w-4 h-4" /> Billing
          </Link>
        </nav>
        <div className="p-4 border-t border-gray-100">
          <div className="text-xs text-gray-500 mb-1">{user?.email}</div>
          <div className="text-xs font-semibold text-sky-600 uppercase mb-3">{profile?.plan || 'Free'} plan</div>
          <button onClick={handleSignOut} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700">
            <LogOut className="w-4 h-4" /> Sign out
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="ml-64 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
              <p className="text-gray-500 text-sm mt-1">Welcome back, {profile?.full_name || 'there'}!</p>
            </div>
            <Link href="/upload" className="bg-sky-600 text-white px-5 py-2.5 rounded-lg font-semibold text-sm hover:bg-sky-700 transition flex items-center gap-2">
              <Plus className="w-4 h-4" /> Upload Photos
            </Link>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mb-8">
            <div className="bg-white rounded-xl p-5 border border-gray-100">
              <div className="text-sm text-gray-500 mb-1">Images used</div>
              <div className="text-2xl font-bold text-gray-900">{profile?.credits_used || 0}</div>
              <div className="text-xs text-gray-400">of {profile?.credits_limit || 10} this month</div>
              <div className="mt-3 bg-gray-100 rounded-full h-1.5">
                <div className="bg-sky-500 h-1.5 rounded-full" style={{ width: `${Math.min(creditsPercent, 100)}%` }} />
              </div>
            </div>
            <div className="bg-white rounded-xl p-5 border border-gray-100">
              <div className="text-sm text-gray-500 mb-1">Orders</div>
              <div className="text-2xl font-bold text-gray-900">{orders.length}</div>
              <div className="text-xs text-gray-400">total orders</div>
            </div>
            <div className="bg-white rounded-xl p-5 border border-gray-100">
              <div className="text-sm text-gray-500 mb-1">Plan</div>
              <div className="text-2xl font-bold text-sky-600 capitalize">{profile?.plan || 'Free'}</div>
              <Link href="/pricing" className="text-xs text-sky-500 hover:underline">Upgrade →</Link>
            </div>
          </div>

          {/* Recent orders */}
          <div className="bg-white rounded-xl border border-gray-100">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between">
              <h2 className="font-semibold text-gray-900">Recent orders</h2>
              <Link href="/orders" className="text-sm text-sky-600 hover:underline">View all</Link>
            </div>
            {orders.length === 0 ? (
              <div className="p-12 text-center">
                <Upload className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 text-sm">No orders yet</p>
                <Link href="/upload" className="mt-3 inline-block text-sky-600 text-sm font-medium hover:underline">
                  Upload your first photos →
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {orders.map(order => (
                  <div key={order.id} className="p-4 flex items-center justify-between">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{order.crop_type}</div>
                      <div className="text-xs text-gray-400">{order.image_count} images • {new Date(order.created_at).toLocaleDateString()}</div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                        order.status === 'done'       ? 'bg-green-100 text-green-700' :
                        order.status === 'processing' ? 'bg-yellow-100 text-yellow-700' :
                        order.status === 'error'      ? 'bg-red-100 text-red-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>{order.status}</span>
                      {order.status === 'done' && (
                        <Link href={`/orders/${order.id}`} className="text-xs text-sky-600 hover:underline">Download</Link>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
