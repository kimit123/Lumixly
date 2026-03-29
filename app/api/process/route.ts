import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  const { orderId, cropType, paths } = await req.json()

  // Update order status to processing
  await supabase.from('orders').update({ status: 'processing' }).eq('id', orderId)

  // Send to Python processing backend (Render.com)
  // This runs async — Python backend calls webhook when done
  fetch(`${process.env.PROCESSING_API_URL}/process`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Secret': process.env.PROCESSING_API_SECRET!,
    },
    body: JSON.stringify({
      order_id: orderId,
      crop_type: cropType,
      input_paths: paths,
      supabase_url: process.env.NEXT_PUBLIC_SUPABASE_URL,
      supabase_key: process.env.SUPABASE_SERVICE_ROLE_KEY,
      callback_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/orders/complete`,
    }),
  }).catch(console.error) // Fire and forget

  return NextResponse.json({ status: 'processing', orderId })
}
