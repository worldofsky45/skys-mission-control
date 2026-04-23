'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckSquare, CheckCircle2, PauseCircle, XCircle, AlertTriangle } from 'lucide-react'
import { sprintData, agentsData } from '@/lib/data'
import { useBoardStore, type DecisionAction } from '@/lib/store'

const fadeInUp = {
  hidden: { opacity: 0, y: 16 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.07, duration: 0.38, ease: 'easeOut' },
  }),
}

const fadeIn = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.4 } },
}

function timeWaiting(status: string): string {
  if (status === 'waiting_on_sky') return '~6h'
  if (status === 'waiting_on_aakash') return '~19h'
  return 'unknown'
}

function whoIsWaiting(status: string): string {
  if (status === 'waiting_on_sky') return 'Sky'
  if (status === 'waiting_on_aakash') return 'Aakash'
  return 'Someone'
}

function whatIsNeeded(task: typeof sprintData.tasks[0]): string {
  if (task.notes) return task.notes
  return 'Approval required to proceed'
}

function Toast({ message, type }: { message: string; type: 'approved' | 'deferred' | 'rejected' }) {
  const colors: Record<string, { bg: string; border: string; color: string }> = {
    approved: { bg: 'rgba(16,185,129,0.15)', border: 'rgba(16,185,129,0.4)', color: '#10b981' },
    deferred: { bg: 'rgba(245,158,11,0.15)', border: 'rgba(245,158,11,0.4)', color: '#f59e0b' },
    rejected: { bg: 'rgba(239,68,68,0.15)', border: 'rgba(239,68,68,0.4)', color: '#ef4444' },
  }
  const c = colors[type]
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -10, scale: 0.95 }}
      className="toast fixed bottom-24 lg:bottom-8 left-1/2 -translate-x-1/2 px-5 py-3 rounded-xl text-sm font-semibold z-[100] shadow-2xl"
      style={{
        background: c.bg,
        border: `1px solid ${c.border}`,
        color: c.color,
        backdropFilter: 'blur(16px)',
        boxShadow: `0 8px 32px rgba(0,0,0,0.5), 0 0 20px ${c.color}22`,
      }}
    >
      {message}
    </motion.div>
  )
}

function BlockerCard({ blocker, index }: { blocker: typeof sprintData.go_live_blockers[0]; index: number }) {
  return (
    <motion.div
      custom={index}
      initial="hidden"
      animate="visible"
      variants={fadeInUp}
      className="rounded-xl p-5"
      style={{
        background: 'rgba(239,68,68,0.06)',
        backdropFilter: 'blur(12px)',
        border: '1px solid rgba(239,68,68,0.3)',
        boxShadow: '0 0 20px rgba(239,68,68,0.1)',
      }}
    >
      <div className="flex items-start gap-4">
        <div className="mt-0.5 shrink-0">
          <div
            className="w-3 h-3 rounded-full pulse-red"
            style={{ backgroundColor: '#ef4444' }}
          />
        </div>
        <div className="flex-1">
          <div className="text-base font-semibold text-red-300 mb-1.5">{blocker.title}</div>
          <div className="text-sm text-slate-400 mb-3">
            <span className="text-red-400/70">Impact:</span> {blocker.impact}
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-sm text-slate-500">
              Owner: <span className="text-slate-300 font-medium">{blocker.owner}</span>
            </span>
            <span
              className="text-xs px-2.5 py-1 rounded-full font-medium"
              style={{
                background: 'rgba(245,158,11,0.15)',
                color: '#f59e0b',
                border: '1px solid rgba(245,158,11,0.3)',
              }}
            >
              {blocker.status.replace(/_/g, ' ')}
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

export default function DecisionsPage() {
  const tasks = useBoardStore(s => s.tasks)
  const decisions = useBoardStore(s => s.decisions)
  const approveTask = useBoardStore(s => s.approveTask)
  const deferTask = useBoardStore(s => s.deferTask)
  const rejectTask = useBoardStore(s => s.rejectTask)

  const [toast, setToast] = useState<{ message: string; type: 'approved' | 'deferred' | 'rejected' } | null>(null)

  const waitingTasks = tasks.filter(
    t => t.status === 'waiting_on_sky' || t.status === 'waiting_on_aakash'
  )

  function showToast(message: string, type: 'approved' | 'deferred' | 'rejected') {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }

  function handleApprove(taskId: string) {
    approveTask(taskId)
    showToast('✅ Approved — moved to In Progress', 'approved')
  }

  function handleDefer(taskId: string) {
    deferTask(taskId)
    showToast('⏸ Deferred — back to Inbox', 'deferred')
  }

  function handleReject(taskId: string) {
    rejectTask(taskId)
    showToast('❌ Rejected — removed from board', 'rejected')
  }

  // Get task title for history display (may be removed from tasks after reject)
  function getTaskTitle(taskId: string): string {
    // Check current tasks first
    const current = tasks.find(t => t.id === taskId)
    if (current) return current.title
    // Fall back to sprintData
    const original = sprintData.tasks.find(t => t.id === taskId)
    if (original) return original.title
    return taskId
  }

  const recentDecisions = [...decisions].reverse().slice(0, 10)

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

      {/* Toast */}
      <AnimatePresence>
        {toast && <Toast key="toast" message={toast.message} type={toast.type} />}
      </AnimatePresence>

      <div className="relative z-10 max-w-[900px] mx-auto px-4 sm:px-6 py-8 space-y-10">

        {/* Header */}
        <motion.div initial="hidden" animate="visible" variants={fadeIn}>
          <div className="flex items-center gap-3 mb-2">
            <CheckSquare size={20} className="text-indigo-400" />
            <h1 className="text-2xl font-black tracking-tight gradient-text">Decisions</h1>
          </div>
          <p className="text-sm text-slate-500">Items waiting for your action to unblock the team</p>
        </motion.div>

        {/* ── Waiting on You ── */}
        <section>
          <motion.div initial="hidden" animate="visible" variants={fadeIn} className="flex items-center gap-2 mb-5">
            <div className="w-2.5 h-2.5 rounded-full pulse-red" style={{ backgroundColor: '#f59e0b' }} />
            <h2 className="text-xs font-semibold uppercase tracking-widest text-amber-400">Waiting on You</h2>
            <span
              className="ml-2 text-xs px-2 py-0.5 rounded-full"
              style={{ background: 'rgba(245,158,11,0.15)', color: '#f59e0b' }}
            >
              {waitingTasks.length} items
            </span>
          </motion.div>

          {waitingTasks.length === 0 ? (
            <motion.div
              custom={0}
              initial="hidden"
              animate="visible"
              variants={fadeInUp}
              className="rounded-xl p-8 text-center text-slate-600 italic text-sm"
              style={{ background: 'rgba(18,18,26,0.6)', border: '1px solid rgba(255,255,255,0.05)' }}
            >
              🎉 Nothing waiting — inbox clear!
            </motion.div>
          ) : (
            <div className="space-y-4">
              {waitingTasks.map((task, i) => {
                const agentName = task.agent.split(' ')[0]
                const blockedAgent = agentsData.find(a => a.name === agentName)
                const waiting = whoIsWaiting(task.status)
                const waitTime = timeWaiting(task.status)

                return (
                  <motion.div
                    key={task.id}
                    custom={i}
                    initial="hidden"
                    animate="visible"
                    variants={fadeInUp}
                    className="rounded-2xl p-5"
                    style={{
                      background: 'rgba(18,18,26,0.9)',
                      backdropFilter: 'blur(12px)',
                      border: '1px solid rgba(245,158,11,0.2)',
                      boxShadow: '0 0 20px rgba(245,158,11,0.08)',
                    }}
                  >
                    <div className="flex items-start justify-between gap-4 mb-4">
                      <div className="flex-1">
                        <div className="text-xs text-slate-600 font-mono mb-1">{task.id}</div>
                        <div className="text-base font-semibold text-white mb-2">{task.title}</div>
                        <p className="text-sm text-slate-400 leading-relaxed">{whatIsNeeded(task)}</p>
                      </div>
                    </div>

                    {/* Meta row */}
                    <div className="flex items-center gap-4 flex-wrap text-xs text-slate-500 mb-4">
                      <span className="flex items-center gap-1.5">
                        <span>{blockedAgent?.emoji ?? '🤖'}</span>
                        Blocked: {agentName}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <div className="w-1.5 h-1.5 rounded-full bg-amber-400 opacity-70" />
                        Waiting on {waiting}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <div className="w-1.5 h-1.5 rounded-full bg-slate-500 opacity-70" />
                        Waiting {waitTime}
                      </span>
                    </div>

                    {/* Action buttons */}
                    <div className="flex gap-3 flex-wrap">
                      <button
                        onClick={() => handleApprove(task.id)}
                        className="decision-btn flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200"
                        style={{
                          background: 'rgba(16,185,129,0.15)',
                          border: '1px solid rgba(16,185,129,0.35)',
                          color: '#10b981',
                        }}
                      >
                        <CheckCircle2 size={14} />
                        Approve
                      </button>
                      <button
                        onClick={() => handleDefer(task.id)}
                        className="decision-btn flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200"
                        style={{
                          background: 'rgba(245,158,11,0.12)',
                          border: '1px solid rgba(245,158,11,0.3)',
                          color: '#f59e0b',
                        }}
                      >
                        <PauseCircle size={14} />
                        Defer
                      </button>
                      <button
                        onClick={() => handleReject(task.id)}
                        className="decision-btn flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200"
                        style={{
                          background: 'rgba(239,68,68,0.1)',
                          border: '1px solid rgba(239,68,68,0.25)',
                          color: '#ef4444',
                        }}
                      >
                        <XCircle size={14} />
                        Reject
                      </button>
                    </div>
                  </motion.div>
                )
              })}
            </div>
          )}
        </section>

        {/* ── Go-Live Blockers ── */}
        <section>
          <motion.div initial="hidden" animate="visible" variants={fadeIn} className="flex items-center gap-2 mb-5">
            <AlertTriangle size={14} className="text-red-400" />
            <h2 className="text-xs font-semibold uppercase tracking-widest text-red-400">Go-Live Blockers</h2>
            <span
              className="ml-2 text-xs px-2 py-0.5 rounded-full"
              style={{ background: 'rgba(239,68,68,0.15)', color: '#ef4444' }}
            >
              {sprintData.go_live_blockers.length} active
            </span>
          </motion.div>

          <div className="space-y-4">
            {sprintData.go_live_blockers.map((b, i) => (
              <BlockerCard key={b.id} blocker={b} index={i} />
            ))}
          </div>
        </section>

        {/* ── Decision History ── */}
        <section>
          <motion.div initial="hidden" animate="visible" variants={fadeIn} className="flex items-center gap-2 mb-5">
            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: '#818cf8' }} />
            <h2 className="text-xs font-semibold uppercase tracking-widest text-indigo-400">Decision History</h2>
            {recentDecisions.length > 0 && (
              <span
                className="ml-2 text-xs px-2 py-0.5 rounded-full"
                style={{ background: 'rgba(99,102,241,0.15)', color: '#818cf8' }}
              >
                {recentDecisions.length} recorded
              </span>
            )}
          </motion.div>

          {recentDecisions.length === 0 ? (
            <motion.div
              custom={0}
              initial="hidden"
              animate="visible"
              variants={fadeInUp}
              className="rounded-xl p-8 text-center text-slate-600 italic text-sm"
              style={{ background: 'rgba(18,18,26,0.6)', border: '1px solid rgba(255,255,255,0.05)' }}
            >
              No decisions recorded yet
            </motion.div>
          ) : (
            <div className="space-y-2">
              {recentDecisions.map((d, i) => {
                const actionColors: Record<DecisionAction, { bg: string; color: string; label: string }> = {
                  approved: { bg: 'rgba(16,185,129,0.15)', color: '#10b981', label: 'APPROVED' },
                  deferred: { bg: 'rgba(245,158,11,0.15)', color: '#f59e0b', label: 'DEFERRED' },
                  rejected: { bg: 'rgba(239,68,68,0.15)', color: '#ef4444', label: 'REJECTED' },
                }
                const ac = actionColors[d.action]
                const ts = new Date(d.timestamp)
                const timeStr = ts.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
                const dateStr = ts.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })

                return (
                  <motion.div
                    key={`${d.taskId}-${d.timestamp}`}
                    custom={i}
                    initial="hidden"
                    animate="visible"
                    variants={fadeInUp}
                    className="flex items-center gap-4 px-4 py-3 rounded-lg"
                    style={{
                      background: 'rgba(18,18,26,0.6)',
                      border: '1px solid rgba(255,255,255,0.05)',
                    }}
                  >
                    {/* Timeline dot */}
                    <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: ac.color }} />
                    {/* Timestamp */}
                    <span className="text-xs text-slate-600 shrink-0 w-[100px]">{dateStr} {timeStr}</span>
                    {/* Action badge */}
                    <span
                      className="text-xs px-2 py-0.5 rounded-full font-bold shrink-0"
                      style={{ background: ac.bg, color: ac.color }}
                    >
                      {ac.label}
                    </span>
                    {/* Task title */}
                    <span className="text-sm text-slate-300 truncate">{getTaskTitle(d.taskId)}</span>
                  </motion.div>
                )
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
