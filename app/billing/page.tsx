'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'
import { Check, CreditCard, ArrowLeft } from 'lucide-react'

const PLANS = [
  {
    id: 'starter',
    name: 'Starter',
    price: 19,
    images: 100,
    perImage: 0.40,
    features: ['100 images/month', 'Background removal', 'All crop types', 'Both output sizes'],
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 49,
    images: 500,
    perImage: 0.25,
    features: ['500 images/month', 'Priority processing', 'Bulk 1000 upload', 'Priority support'],
    popular: true,
  },
]

export default function BillingPage() {
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) return
      supabase.from('profiles').select('*').eq('id', data.user.id).single()
        .then(({ data: p }) => { setProfile(p); setLoading(false) })
    })
  }, [])

  const handleUpgrade = async (planId: string) => {
    const supabase = createClient()
    const { data } = await supabase.auth.getSession()
    const token = data.session?.access_token
    window.location.href = `/api/stripe?plan=${planId}`
  }

  if (loading) return <div className="min-h-screen bg-gray-50 flex items-center justify-center text-gray-400">Loading...</div>

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-100 px-8 py-4 flex items-center justify-between">
        <Link href="/dashboard" className="text-xl font-bold text-sky-600">Lumixly</Link>
        <Link href="/dashboard" className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1">
          <ArrowLeft className="w-4 h-4" /> Dashboard
        </Link>
      </nav>

      <div className="max-w-3xl mx-auto px-6 py-10">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Billing</h1>
        <p className="text-gray-500 text-sm mb-8">
          Current plan: <span className="font-semibold text-sky-600 capitalize">{profile?.plan || 'Free'}</span>
          {' '}• {profile?.credits_used || 0}/{profile?.credits_limit || 10} images used this month
        </p>

        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {PLANS.map(plan => {
            const isCurrent = profile?.plan === plan.id
            return (
              <div key={plan.id} className={`bg-white rounded-xl border-2 p-6 ${
                plan.popular ? 'border-sky-500' : 'border-gray-100'
              }`}>
                {plan.popular && (
                  <div className="text-xs font-bold bg-sky-500 text-white px-3 py-1 rounded-full inline-block mb-4">MOST POPULAR</div>
                )}
                <h3 className="text-xl font-bold text-gray-900 mb-1">{plan.name}</h3>
                <div className="mb-4">
                  <span className="text-3xl font-black text-gray-900">£{plan.price}</span>
                  <span className="text-gray-500 text-sm">/month</span>
                </div>
                <div className="text-sm text-sky-600 font-semibold mb-1">{plan.images} images/month included</div>
                <div className="text-xs text-gray-400 mb-5">£{plan.perImage} per extra image</div>
                <ul className="space-y-2 mb-6">
                  {plan.features.map(f => (
                    <li key={f} className="flex items-center gap-2 text-sm text-gray-600">
                      <Check className="w-4 h-4 text-sky-500" /> {f}
                    </li>
                  ))}
                </ul>
                {isCurrent ? (
                  <div className="w-full py-2.5 rounded-lg border-2 border-sky-500 text-sky-600 font-semibold text-center text-sm">
                    ✓ Current plan
                  </div>
                ) : (
                  <button onClick={() => handleUpgrade(plan.id)}
                    className="w-full py-2.5 rounded-lg bg-sky-600 text-white font-semibold text-sm hover:bg-sky-700 transition">
                    Upgrade to {plan.name}
                  </button>
                )}
              </div>
            )
          })}
        </div>

        {profile?.stripe_subscription_id && (
          <div className="bg-white rounded-xl border border-gray-100 p-6">
            <div className="flex items-center gap-3 mb-2">
              <CreditCard className="w-5 h-5 text-gray-400" />
              <h3 className="font-semibold text-gray-900">Subscription</h3>
            </div>
            <p className="text-sm text-gray-500 mb-4">Manage your billing in the Stripe customer portal.</p>
            <a href="/api/stripe/portal" className="text-sm text-sky-600 font-medium hover:underline">
              Open billing portal →
            </a>
          </div>
        )}
      </div>
    </div>
  )
}
