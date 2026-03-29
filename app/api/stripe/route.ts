import { NextRequest, NextResponse } from 'next/server'
import { stripe, PLANS } from '@/lib/stripe'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(req: NextRequest) {
  const plan = req.nextUrl.searchParams.get('plan') as 'starter' | 'pro'
  if (!plan || !PLANS[plan]) {
    return NextResponse.json({ error: 'Invalid plan' }, { status: 400 })
  }

  // Get user from cookie/header
  const authHeader = req.headers.get('authorization')
  const token = authHeader?.replace('Bearer ', '')

  let userId = 'unknown'
  let userEmail = ''
  if (token) {
    const { data } = await supabase.auth.getUser(token)
    if (data.user) {
      userId    = data.user.id
      userEmail = data.user.email || ''
    }
  }

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    mode: 'subscription',
    line_items: [{
      price: PLANS[plan].priceId,
      quantity: 1,
    }],
    customer_email: userEmail || undefined,
    metadata: { userId, plan },
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?success=1`,
    cancel_url:  `${process.env.NEXT_PUBLIC_APP_URL}/pricing`,
  })

  return NextResponse.redirect(session.url!)
}
