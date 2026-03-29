import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Lumixly — AI Photo Editing for Ecommerce',
  description: 'Professional background removal, headless crop, and body-aware photo editing. Built for ecommerce sellers.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
