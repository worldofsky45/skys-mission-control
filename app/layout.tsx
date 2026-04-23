import type { Metadata } from 'next'
import './globals.css'
import Nav from './components/Nav'

export const metadata: Metadata = {
  title: '🚀 Sky\'s Mission Control — PropSprint',
  description: 'Real-time sprint dashboard for the PropSprint agent team',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <body style={{ backgroundColor: '#0a0a0f', minHeight: '100vh' }}>
        <div className="flex min-h-screen">
          {/* Left sidebar nav (desktop) */}
          <Nav />
          {/* Main content */}
          <main className="flex-1 min-w-0 pb-20 lg:pb-0">
            {children}
          </main>
        </div>
      </body>
    </html>
  )
}
