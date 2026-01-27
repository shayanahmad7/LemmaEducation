import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Lemma Education | AI That Listens',
  description: 'Practice Smarter, Learn Deeper',
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
