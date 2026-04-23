'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Bot, Radio, CheckSquare, Brain, Calendar } from 'lucide-react'

const navItems = [
  { href: '/', label: 'Overview', icon: Home },
  { href: '/agents', label: 'Agents', icon: Bot },
  { href: '/feed', label: 'Mission Feed', icon: Radio },
  { href: '/decisions', label: 'Decisions', icon: CheckSquare },
  { href: '/memory', label: '🧠 Memory', icon: Brain },
  { href: '/calendar', label: '📅 Calendar', icon: Calendar },
]

export default function Nav() {
  const pathname = usePathname()

  return (
    <>
      {/* ── Desktop Left Sidebar ── */}
      <nav
        className="hidden lg:flex flex-col w-56 shrink-0 min-h-screen sticky top-0 h-screen"
        style={{
          background: 'rgba(12,12,20,0.95)',
          backdropFilter: 'blur(16px)',
          borderRight: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        {/* Logo */}
        <div className="px-5 pt-6 pb-8">
          <span
            className="text-base font-black tracking-tight"
            style={{
              background: 'linear-gradient(135deg, #818cf8, #22d3ee)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            🚀 Mission Control
          </span>
        </div>

        {/* Nav Items */}
        <div className="flex flex-col gap-1 px-3">
          {navItems.map(({ href, label, icon: Icon }) => {
            const isActive = href === '/' ? pathname === '/' : pathname.startsWith(href)
            return (
              <Link
                key={href}
                href={href}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200"
                style={{
                  color: isActive ? '#a5b4fc' : '#94a3b8',
                  background: isActive ? 'rgba(99,102,241,0.15)' : 'transparent',
                  border: isActive ? '1px solid rgba(99,102,241,0.25)' : '1px solid transparent',
                  boxShadow: isActive ? '0 0 12px rgba(99,102,241,0.15)' : 'none',
                }}
              >
                <Icon
                  size={16}
                  style={{ color: isActive ? '#818cf8' : '#64748b' }}
                />
                {label}
              </Link>
            )
          })}
        </div>

        {/* Bottom spacer */}
        <div className="mt-auto px-5 pb-6">
          <div className="text-xs text-slate-700 font-medium">PropSprint · Sprint 1</div>
        </div>
      </nav>

      {/* ── Mobile Bottom Tab Bar ── */}
      <nav
        className="lg:hidden fixed bottom-0 left-0 right-0 z-50 flex items-center justify-around px-2 py-2"
        style={{
          background: 'rgba(10,10,15,0.97)',
          backdropFilter: 'blur(16px)',
          borderTop: '1px solid rgba(255,255,255,0.08)',
        }}
      >
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive = href === '/' ? pathname === '/' : pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              className="flex flex-col items-center gap-1 px-3 py-1 rounded-lg transition-all duration-200"
              style={{ color: isActive ? '#a5b4fc' : '#64748b' }}
            >
              <Icon size={20} style={{ color: isActive ? '#818cf8' : '#64748b' }} />
              <span className="text-[10px] font-medium">{label}</span>
            </Link>
          )
        })}
      </nav>
    </>
  )
}
