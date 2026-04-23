'use client'

import { motion } from 'framer-motion'
import { Radio } from 'lucide-react'
import { activityLog, agentsData } from '@/lib/data'

const fadeInUp = {
  hidden: { opacity: 0, y: 16 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.05, duration: 0.35, ease: 'easeOut' },
  }),
}

const fadeIn = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.4 } },
}

const eventTypeConfig = {
  TASK_START: { color: '#6366f1', bg: 'rgba(99,102,241,0.15)', label: 'TASK START', borderColor: 'rgba(99,102,241,0.2)' },
  HANDOFF: { color: '#f59e0b', bg: 'rgba(245,158,11,0.15)', label: 'HANDOFF', borderColor: 'rgba(245,158,11,0.2)' },
  APPROVED: { color: '#10b981', bg: 'rgba(16,185,129,0.15)', label: 'APPROVED', borderColor: 'rgba(16,185,129,0.2)' },
  BLOCKED: { color: '#ef4444', bg: 'rgba(239,68,68,0.15)', label: 'BLOCKED', borderColor: 'rgba(239,68,68,0.2)' },
  DONE: { color: '#10b981', bg: 'rgba(16,185,129,0.15)', label: 'DONE', borderColor: 'rgba(16,185,129,0.2)' },
  COMMENT: { color: '#94a3b8', bg: 'rgba(148,163,184,0.1)', label: 'COMMENT', borderColor: 'rgba(148,163,184,0.1)' },
}

// Color for agent avatar bubble
const agentColors: Record<string, string> = {
  nova: '#6366f1',
  forge: '#f59e0b',
  sentry: '#ef4444',
  vaultara: '#8b5cf6',
  prism: '#22d3ee',
  axiom: '#10b981',
  lex: '#64748b',
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  return `${Math.floor(hours / 24)}d ago`
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
}

// Sorted newest first
const sortedLog = [...activityLog].sort(
  (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
)

export default function FeedPage() {
  return (
    <div
      className="relative min-h-screen"
      style={{ background: 'linear-gradient(135deg, #0a0a0f 0%, #0d0d1a 50%, #0a0f1a 100%)' }}
    >
      {/* Background grid */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(rgba(99,102,241,0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(99,102,241,0.03) 1px, transparent 1px)
          `,
          backgroundSize: '60px 60px',
        }}
      />

      <div className="relative z-10 max-w-[800px] mx-auto px-4 sm:px-6 py-8 space-y-6">

        {/* Header */}
        <motion.div initial="hidden" animate="visible" variants={fadeIn}>
          <div className="flex items-center gap-3 mb-2">
            <Radio size={20} className="text-indigo-400" />
            <h1 className="text-2xl font-black tracking-tight gradient-text">Mission Feed</h1>
            <span
              className="ml-2 text-xs px-2.5 py-1 rounded-full font-semibold"
              style={{ background: 'rgba(255,255,255,0.07)', color: '#94a3b8', border: '1px solid rgba(255,255,255,0.1)' }}
            >
              {sortedLog.length} events
            </span>
          </div>
          <p className="text-sm text-slate-500">Real-time activity log for the PropSprint agent team</p>
        </motion.div>

        {/* Feed */}
        <div className="space-y-3">
          {sortedLog.map((event, i) => {
            const cfg = eventTypeConfig[event.type] ?? eventTypeConfig.COMMENT
            const agent = agentsData.find(a => a.id === event.agent)
            const avatarColor = agentColors[event.agent] ?? '#64748b'
            const isLast = i === sortedLog.length - 1

            return (
              <motion.div
                key={event.id}
                custom={i}
                initial="hidden"
                animate="visible"
                variants={fadeInUp}
                className="flex gap-4"
              >
                {/* Left: avatar + connector */}
                <div className="flex flex-col items-center">
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center text-base shrink-0"
                    style={{
                      background: `${avatarColor}22`,
                      border: `1px solid ${avatarColor}44`,
                    }}
                  >
                    {agent?.emoji ?? '🤖'}
                  </div>
                  {!isLast && (
                    <div
                      className="timeline-connector mt-1"
                      style={{ backgroundColor: `${avatarColor}20` }}
                    />
                  )}
                </div>

                {/* Right: event card */}
                <div
                  className="flex-1 rounded-xl p-4 mb-1 transition-all duration-200"
                  style={{
                    background: 'rgba(18,18,26,0.85)',
                    backdropFilter: 'blur(8px)',
                    border: `1px solid ${cfg.borderColor}`,
                    boxShadow: `0 2px 8px rgba(0,0,0,0.3)`,
                  }}
                >
                  {/* Top row */}
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <span
                      className="text-xs font-bold px-2 py-0.5 rounded tracking-wide"
                      style={{ background: cfg.bg, color: cfg.color }}
                    >
                      {cfg.label}
                    </span>
                    <span
                      className="text-xs font-semibold"
                      style={{ color: avatarColor }}
                    >
                      {agent?.name ?? event.agent}
                    </span>
                    <span className="text-xs text-slate-600 ml-auto">{timeAgo(event.timestamp)} · {formatTime(event.timestamp)}</span>
                  </div>

                  {/* Message */}
                  <p className="text-sm text-slate-300 leading-relaxed">{event.message}</p>

                  {/* Task chip */}
                  {event.taskId && (
                    <div className="mt-2">
                      <span
                        className="text-xs px-2 py-0.5 rounded font-mono"
                        style={{
                          background: 'rgba(255,255,255,0.05)',
                          color: '#64748b',
                          border: '1px solid rgba(255,255,255,0.08)',
                        }}
                      >
                        {event.taskId}
                      </span>
                    </div>
                  )}
                </div>
              </motion.div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
