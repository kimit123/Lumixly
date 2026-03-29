'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'
import { Download, Clock, CheckCircle, AlertCircle, ArrowLeft } from 'lucide-react'

export default function OrderPage() {
  const params  = useParams()
  const router  = useRouter()
  const [order, setOrder] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()
    const fetchOrder = async () => {
      const { data } = await supabase.from('orders')
        .select('*').eq('id', params.id).single()
      setOrder(data)
      setLoading(false)
    }
    fetchOrder()
    // Poll every 3s while processing
    const interval = setInterval(async () => {
      const { data } = await supabase.from('orders')
        .select('*').eq('id', params.id).single()
      setOrder(data)
      if (data?.status === 'done' || data?.status === 'error') {
        clearInterval(interval)
      }
    }, 3000)
    return () => clearInterval(interval)
  }, [params.id])

  const downloadAll = () => {
    if (!order?.output_urls) return
    order.output_urls.forEach((url: string, i: number) => {
      const a = document.createElement('a')
      a.href = url; a.download = `lumixly_${i+1}.jpg`
      a.click()
    })
  }

  if (loading) return <div className="min-h-screen bg-gray-50 flex items-center justify-center text-gray-400">Loading...</div>
  if (!order)  return <div className="min-h-screen bg-gray-50 flex items-center justify-center text-gray-400">Order not found</div>

  const isProcessing = order.status === 'processing' || order.status === 'pending'
  const isDone       = order.status === 'done'
  const isError      = order.status === 'error'

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-100 px-8 py-4 flex items-center justify-between">
        <Link href="/dashboard" className="text-xl font-bold text-sky-600">Lumixly</Link>
        <Link href="/dashboard" className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1">
          <ArrowLeft className="w-4 h-4" /> Dashboard
        </Link>
      </nav>

      <div className="max-w-3xl mx-auto px-6 py-10">
        <div className="bg-white rounded-xl border border-gray-100 p-8 mb-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-xl font-bold text-gray-900">Order #{order.id.slice(0,8)}</h1>
              <p className="text-sm text-gray-500 mt-1">{order.image_count} images • {order.crop_type}</p>
            </div>
            <div className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium ${
              isDone       ? 'bg-green-100 text-green-700' :
              isError      ? 'bg-red-100 text-red-700' :
              'bg-yellow-100 text-yellow-700'
            }`}>
              {isDone       && <><CheckCircle className="w-4 h-4" /> Done</>}
              {isError      && <><AlertCircle className="w-4 h-4" /> Error</>}
              {isProcessing && <><Clock className="w-4 h-4" /> Processing...</>}
            </div>
          </div>

          {isProcessing && (
            <div className="text-center py-12">
              <div className="w-12 h-12 border-4 border-sky-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-gray-600 font-medium">Processing your photos...</p>
              <p className="text-gray-400 text-sm mt-1">This usually takes 30-60 seconds per image</p>
            </div>
          )}

          {isError && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 text-sm">
              {order.error_message || 'An error occurred during processing'}
            </div>
          )}

          {isDone && (
            <>
              <div className="flex items-center justify-between mb-4">
                <p className="text-gray-600 text-sm">{order.output_urls?.length || 0} files ready to download</p>
                <button onClick={downloadAll}
                  className="flex items-center gap-2 bg-sky-600 text-white px-5 py-2.5 rounded-lg font-semibold text-sm hover:bg-sky-700 transition">
                  <Download className="w-4 h-4" /> Download All
                </button>
              </div>
              <div className="grid grid-cols-3 gap-3">
                {(order.output_urls || []).slice(0, 9).map((url: string, i: number) => (
                  <div key={i} className="relative group">
                    <img src={url} alt={`Output ${i+1}`}
                      className="w-full aspect-square object-cover rounded-lg border border-gray-100" />
                    <a href={url} download={`lumixly_${i+1}.jpg`}
                      className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition rounded-lg flex items-center justify-center">
                      <Download className="w-6 h-6 text-white" />
                    </a>
                  </div>
                ))}
                {(order.output_urls?.length || 0) > 9 && (
                  <div className="aspect-square bg-gray-100 rounded-lg flex items-center justify-center text-gray-500 font-medium">
                    +{order.output_urls.length - 9} more
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        <div className="flex gap-4">
          <Link href="/upload" className="flex-1 bg-sky-600 text-white py-3 rounded-xl font-semibold text-center hover:bg-sky-700 transition">
            Upload more photos
          </Link>
          <Link href="/dashboard" className="flex-1 border border-gray-200 text-gray-700 py-3 rounded-xl font-semibold text-center hover:border-gray-300 transition">
            Back to dashboard
          </Link>
        </div>
      </div>
    </div>
  )
}
