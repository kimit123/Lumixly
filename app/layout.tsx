import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Lumixly — Professional Photo Editing for Ecommerce',
  description: 'Upload your photos, we edit them, you approve. Professional ecommerce photo editing service.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, padding: 0 }}>{children}</body>
    </html>
  )
}
