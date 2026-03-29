import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Called by Python backend when processing is complete
export async function POST(req: NextRequest) {
  const secret = req.headers.get('x-secret')
  if (secret !== process.env.PROCESSING_API_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { order_id, status, output_urls, error } = await req.json()

  await supabase.from('orders').update({
    status,
    output_urls: output_urls || [],
    error_message: error || null,
    completed_at: new Date().toISOString(),
  }).eq('id', order_id)

  // Update credits used
  if (status === 'done') {
    const { data: order } = await supabase.from('orders')
      .select('user_id, image_count').eq('id', order_id).single()
    if (order) {
      await supabase.rpc('increment_credits', {
        user_id: order.user_id,
        amount: order.image_count,
      })
    }
  }

  return NextResponse.json({ ok: true })
}
