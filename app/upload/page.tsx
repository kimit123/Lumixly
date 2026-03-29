'use client'
import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Upload, X, CheckCircle, AlertCircle, Image } from 'lucide-react'
import { createClient } from '@/lib/supabase'

const CROP_TYPES = [
  { id: 'headless',   label: 'Headless',        desc: 'Remove face — keep body' },
  { id: 'full_body',  label: 'Full Body',        desc: 'Head to toe' },
  { id: 'upper_half', label: 'Upper Half',       desc: 'Head to waist' },
  { id: 'head_knees', label: 'Head to Knees',    desc: 'Ideal for dresses' },
  { id: 'no_crop',    label: 'No Crop',          desc: 'Background removal only' },
  { id: 'closer',     label: 'Closer Shot',      desc: 'Detail/close-up photos' },
  { id: 'product',    label: 'Product Only',     desc: 'Bags, shoes, accessories' },
]

export default function UploadPage() {
  const [files, setFiles]       = useState<File[]>([])
  const [cropType, setCropType] = useState('headless')
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError]       = useState('')
  const router = useRouter()

  const onDrop = useCallback((accepted: File[]) => {
    setFiles(prev => [...prev, ...accepted].slice(0, 1000))
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.jpg', '.jpeg', '.png', '.webp'] },
    maxFiles: 1000,
  })

  const removeFile = (i: number) => setFiles(prev => prev.filter((_, idx) => idx !== i))

  const handleSubmit = async () => {
    if (!files.length) return
    setUploading(true); setError('')
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/auth/login'); return }

    try {
      // Create order record
      const { data: order, error: orderErr } = await supabase.from('orders').insert({
        user_id: user.id,
        status: 'pending',
        image_count: files.length,
        crop_type: cropType,
      }).select().single()
      if (orderErr) throw orderErr

      // Upload files to Supabase storage
      const uploadedPaths: string[] = []
      for (let i = 0; i < files.length; i++) {
        const file  = files[i]
        const path  = `${user.id}/${order.id}/${file.name}`
        const { error: upErr } = await supabase.storage
          .from('uploads').upload(path, file)
        if (upErr) throw upErr
        uploadedPaths.push(path)
        setProgress(Math.round(((i + 1) / files.length) * 100))
      }

      // Trigger processing
      await fetch('/api/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: order.id, cropType, paths: uploadedPaths }),
      })

      router.push(`/orders/${order.id}`)
    } catch (e: any) {
      setError(e.message || 'Upload failed')
      setUploading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Nav */}
      <nav className="bg-white border-b border-gray-100 px-8 py-4 flex items-center justify-between">
        <Link href="/dashboard" className="text-xl font-bold text-sky-600">Lumixly</Link>
        <Link href="/dashboard" className="text-sm text-gray-500 hover:text-gray-700">← Dashboard</Link>
      </nav>

      <div className="max-w-3xl mx-auto px-6 py-10">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Upload Photos</h1>
        <p className="text-gray-500 text-sm mb-8">Upload up to 1000 photos at once</p>

        {/* Crop type selector */}
        <div className="bg-white rounded-xl border border-gray-100 p-6 mb-6">
          <h2 className="font-semibold text-gray-900 mb-4">Select crop type</h2>
          <div className="grid grid-cols-2 gap-3">
            {CROP_TYPES.map(ct => (
              <button key={ct.id} onClick={() => setCropType(ct.id)}
                className={`text-left p-3 rounded-lg border-2 transition ${
                  cropType === ct.id ? 'border-sky-500 bg-sky-50' : 'border-gray-100 hover:border-gray-200'
                }`}>
                <div className={`text-sm font-semibold ${cropType === ct.id ? 'text-sky-700' : 'text-gray-900'}`}>{ct.label}</div>
                <div className="text-xs text-gray-500">{ct.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Dropzone */}
        <div {...getRootProps()} className={`bg-white rounded-xl border-2 border-dashed p-12 text-center cursor-pointer transition mb-6 ${
          isDragActive ? 'border-sky-400 bg-sky-50' : 'border-gray-200 hover:border-sky-300'
        }`}>
          <input {...getInputProps()} />
          <Upload className="w-10 h-10 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-600 font-medium">Drop photos here or click to browse</p>
          <p className="text-gray-400 text-sm mt-1">JPG, PNG, WEBP • Up to 1000 photos</p>
        </div>

        {/* File list */}
        {files.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-100 mb-6">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
              <span className="font-semibold text-gray-900">{files.length} photos selected</span>
              <button onClick={() => setFiles([])} className="text-sm text-red-500 hover:underline">Clear all</button>
            </div>
            <div className="max-h-48 overflow-y-auto divide-y divide-gray-50">
              {files.slice(0, 50).map((file, i) => (
                <div key={i} className="flex items-center justify-between px-4 py-2">
                  <div className="flex items-center gap-2">
                    <Image className="w-4 h-4 text-gray-300" />
                    <span className="text-sm text-gray-700 truncate max-w-xs">{file.name}</span>
                  </div>
                  <button onClick={() => removeFile(i)}><X className="w-4 h-4 text-gray-300 hover:text-red-400" /></button>
                </div>
              ))}
              {files.length > 50 && (
                <div className="px-4 py-2 text-sm text-gray-400">+ {files.length - 50} more files</div>
              )}
            </div>
          </div>
        )}

        {/* Progress */}
        {uploading && (
          <div className="bg-white rounded-xl border border-gray-100 p-6 mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Uploading...</span>
              <span className="text-sm text-sky-600 font-semibold">{progress}%</span>
            </div>
            <div className="bg-gray-100 rounded-full h-2">
              <div className="bg-sky-500 h-2 rounded-full transition-all" style={{ width: `${progress}%` }} />
            </div>
          </div>
        )}

        {error && (
          <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg p-4 mb-6 text-red-700 text-sm">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {error}
          </div>
        )}

        <button onClick={handleSubmit} disabled={!files.length || uploading}
          className="w-full bg-sky-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-sky-700 transition disabled:opacity-40 disabled:cursor-not-allowed">
          {uploading ? `Uploading ${progress}%...` : `Process ${files.length || 0} photos →`}
        </button>
      </div>
    </div>
  )
}
