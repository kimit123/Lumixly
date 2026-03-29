import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { createClient } from '@supabase/supabase-js'
import Stripe from 'stripe'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const PLAN_LIMITS: Record<string, { limit: number }> = {
  starter: { limit: 100 },
  pro:     { limit: 500 },
}

export async function POST(req: NextRequest) {
  const body = await req.text()
  const sig  = req.headers.get('stripe-signature')!

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session
    const { userId, plan } = session.metadata || {}
    if (userId && plan && PLAN_LIMITS[plan]) {
      // Update user profile
      await supabase.from('profiles').update({
        plan,
        credits_limit: PLAN_LIMITS[plan].limit,
        stripe_customer_id: session.customer,
        stripe_subscription_id: session.subscription,
      }).eq('id', userId)
    }
  }

  if (event.type === 'customer.subscription.deleted') {
    const sub = event.data.object as Stripe.Subscription
    // Downgrade to free
    await supabase.from('profiles').update({
      plan: 'free',
      credits_limit: 10,
      stripe_subscription_id: null,
    }).eq('stripe_subscription_id', sub.id)
  }

  return NextResponse.json({ received: true })
}
