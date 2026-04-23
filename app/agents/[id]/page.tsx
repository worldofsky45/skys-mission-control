'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { ArrowLeft, Clock, CheckCircle2, Brain, Zap, Send } from 'lucide-react'
import { useRef, useState, useEffect, FormEvent } from 'react'
import {
  agentsData,
  sprintData,
  getAgentEvents,
  getAgentMemory,
} from '@/lib/data'

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.07, duration: 0.4, ease: 'easeOut' },
  }),
}

const fadeIn = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.4 } },
}

const eventTypeConfig = {
  TASK_START: { color: '#6366f1', bg: 'rgba(99,102,241,0.15)', label: 'TASK START' },
  HANDOFF: { color: '#f59e0b', bg: 'rgba(245,158,11,0.15)', label: 'HANDOFF' },
  APPROVED: { color: '#10b981', bg: 'rgba(16,185,129,0.15)', label: 'APPROVED' },
  BLOCKED: { color: '#ef4444', bg: 'rgba(239,68,68,0.15)', label: 'BLOCKED' },
  DONE: { color: '#10b981', bg: 'rgba(16,185,129,0.15)', label: 'DONE' },
  COMMENT: { color: '#94a3b8', bg: 'rgba(148,163,184,0.1)', label: 'COMMENT' },
}

const openingGreetings: Record<string, string> = {
  nova: "Hey Sky 👋 I'm Nova, your orchestrator. I track everything happening across the team. What do you need?",
  vaultara: "🔐 Vaultara here. All secrets are accounted for. Need to check a key, rotate something, or talk security?",
  sentry: "🛡️ Sentry online. Running threat scans. Ask me about security posture, audit results, or any suspicious activity.",
  forge: "🔨 Forge ready to build. Point me at a spec and I'll get it done. What are we shipping?",
  prism: "🔎 Prism here. I keep quality high. Want a code review, a check on acceptance criteria, or a second opinion?",
  axiom: "🔬 Axiom standing by. I validate the data layer. Ask me about test results, calculation accuracy, or RLS policies.",
  lex: "⚖️ Lex here. Documentation, decisions, compliance — I keep the team honest. What do you need logged or clarified?",
}

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
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

function formatTime(date: Date): string {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

function AgentChat({ agentId, agentEmoji, agentName }: { agentId: string; agentEmoji: string; agentName: string }) {
  const greeting = openingGreetings[agentId] ?? `Hi! I'm ${agentName}. How can I help?`
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'assistant', content: greeting, timestamp: new Date() },
  ])
  const [input, setInput] = useState('')
  const [isThinking, setIsThinking] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isThinking])

  async function sendMessage(e?: FormEvent) {
    e?.preventDefault()
    const text = input.trim()
    if (!text || isThinking) return

    const userMsg: ChatMessage = { role: 'user', content: text, timestamp: new Date() }
    const updatedMessages = [...messages, userMsg]
    setMessages(updatedMessages)
    setInput('')
    setIsThinking(true)

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agentId,
          messages: updatedMessages.map(m => ({ role: m.role, content: m.content })),
        }),
      })
      const data = await res.json()
      if (data.reply) {
        setMessages(prev => [...prev, { role: 'assistant', content: data.reply, timestamp: new Date() }])
      } else {
        setMessages(prev => [
          ...prev,
          { role: 'assistant', content: `⚠️ ${data.error ?? 'Something went wrong.'}`, timestamp: new Date() },
        ])
      }
    } catch {
      setMessages(prev => [
        ...prev,
        { role: 'assistant', content: '⚠️ Network error. Please try again.', timestamp: new Date() },
      ])
    } finally {
      setIsThinking(false)
      inputRef.current?.focus()
    }
  }

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{
        background: 'rgba(18,18,26,0.9)',
        backdropFilter: 'blur(12px)',
        border: '1px solid rgba(255,255,255,0.08)',
        boxShadow: '0 0 40px rgba(99,102,241,0.08), 0 4px 20px rgba(0,0,0,0.4)',
      }}
    >
      {/* Chat header */}
      <div
        className="flex items-center gap-3 px-5 py-4"
        style={{
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          background: 'rgba(99,102,241,0.06)',
        }}
      >
        <span className="text-2xl leading-none">{agentEmoji}</span>
        <span className="font-semibold text-white text-sm">Chat with {agentName}</span>
        <div className="flex items-center gap-1.5 ml-auto">
          <div
            className="w-2 h-2 rounded-full pulse-green"
            style={{ backgroundColor: '#10b981', boxShadow: '0 0 6px #10b981' }}
          />
          <span className="text-xs text-emerald-400 font-medium">Online</span>
        </div>
      </div>

      {/* Messages thread */}
      <div
        className="px-5 py-4 space-y-4 overflow-y-auto"
        style={{ minHeight: '300px', maxHeight: '500px' }}
      >
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
          >
            {/* Avatar */}
            {msg.role === 'assistant' && (
              <div className="shrink-0 text-xl leading-none mt-1">{agentEmoji}</div>
            )}

            {/* Bubble */}
            <div className={`max-w-[75%] flex flex-col gap-1 ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
              <div
                className="rounded-2xl px-4 py-3 text-sm leading-relaxed"
                style={
                  msg.role === 'user'
                    ? {
                        background: 'rgba(99,102,241,0.2)',
                        border: '1px solid rgba(99,102,241,0.3)',
                        color: 'white',
                      }
                    : {
                        background: 'rgba(18,18,26,0.9)',
                        border: '1px solid rgba(255,255,255,0.08)',
                        color: '#cbd5e1',
                      }
                }
              >
                {msg.content}
              </div>
              <span className="text-[10px] text-slate-600 px-1">{formatTime(msg.timestamp)}</span>
            </div>
          </div>
        ))}

        {/* Typing indicator */}
        {isThinking && (
          <div className="flex gap-3 flex-row">
            <div className="shrink-0 text-xl leading-none mt-1">{agentEmoji}</div>
            <div
              className="rounded-2xl px-4 py-3 flex items-center gap-1.5"
              style={{
                background: 'rgba(18,18,26,0.9)',
                border: '1px solid rgba(255,255,255,0.08)',
              }}
            >
              <div className="typing-dot" />
              <div className="typing-dot" />
              <div className="typing-dot" />
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <form
        onSubmit={sendMessage}
        className="flex items-center gap-3 px-5 py-4"
        style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}
      >
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder={`Message ${agentName}…`}
          disabled={isThinking}
          className="flex-1 text-sm text-white placeholder-slate-600 bg-transparent outline-none rounded-xl px-4 py-2.5 disabled:opacity-50"
          style={{
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.08)',
          }}
          onKeyDown={e => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              sendMessage()
            }
          }}
        />
        <button
          type="submit"
          disabled={!input.trim() || isThinking}
          className="flex items-center justify-center w-10 h-10 rounded-xl transition-all disabled:opacity-30 disabled:cursor-not-allowed hover:opacity-80"
          style={{
            background: 'rgba(99,102,241,0.3)',
            border: '1px solid rgba(99,102,241,0.4)',
          }}
        >
          <Send size={15} className="text-indigo-300" />
        </button>
      </form>
    </div>
  )
}

export default function AgentDetailPage({ params }: { params: { id: string } }) {
  const { id } = params
  const agent = agentsData.find(a => a.id === id)

  if (!agent) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#0a0a0f' }}>
        <div className="text-center">
          <div className="text-4xl mb-4">🤖</div>
          <div className="text-slate-400 mb-4">Agent not found: {id}</div>
          <Link href="/agents" className="text-indigo-400 hover:text-indigo-300 text-sm">
            ← Back to roster
          </Link>
        </div>
      </div>
    )
  }

  const events = getAgentEvents(agent.id, 10)
  const memory = getAgentMemory(agent.id)

  // Find tasks assigned to this agent
  const agentTasks = sprintData.tasks.filter(t =>
    t.agent.toLowerCase().includes(agent.name.toLowerCase())
  )
  const currentTask = agentTasks.find(t => t.status === 'in_progress')
  const doneTasks = agentTasks.filter(t => t.status === 'done')

  const lastEvent = events[0]

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

      <div className="relative z-10 max-w-[900px] mx-auto px-4 sm:px-6 py-8 space-y-6">

        {/* Back link */}
        <motion.div initial="hidden" animate="visible" variants={fadeIn}>
          <Link
            href="/agents"
            className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-300 transition-colors mb-4"
          >
            <ArrowLeft size={14} />
            Back to roster
          </Link>
        </motion.div>

        {/* ── Hero ── */}
        <motion.div
          custom={0}
          initial="hidden"
          animate="visible"
          variants={fadeInUp}
          className="rounded-2xl p-6"
          style={{
            background: 'rgba(18,18,26,0.9)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(255,255,255,0.08)',
            boxShadow: '0 0 40px rgba(99,102,241,0.1), 0 4px 20px rgba(0,0,0,0.4)',
          }}
        >
          <div className="flex flex-col sm:flex-row sm:items-center gap-5">
            <span className="text-7xl leading-none">{agent.emoji}</span>
            <div className="flex-1">
              <div className="flex items-center gap-3 flex-wrap mb-2">
                <h1 className="text-3xl font-black text-white">{agent.name}</h1>
                <span
                  className="text-sm px-3 py-1 rounded-full font-semibold"
                  style={{ background: 'rgba(99,102,241,0.2)', color: '#818cf8', border: '1px solid rgba(99,102,241,0.3)' }}
                >
                  {agent.role}
                </span>
                <div className="flex items-center gap-2">
                  <div
                    className={`w-2.5 h-2.5 rounded-full ${agent.active ? 'pulse-green' : ''}`}
                    style={{
                      backgroundColor: agent.active ? '#10b981' : '#4b5563',
                      boxShadow: agent.active ? '0 0 8px #10b981' : 'none',
                    }}
                  />
                  <span className="text-sm font-medium" style={{ color: agent.active ? '#10b981' : '#6b7280' }}>
                    {agent.active ? 'Active' : 'Idle'}
                  </span>
                </div>
              </div>
              <p className="text-slate-400 leading-relaxed">{agent.tagline}</p>
            </div>
          </div>
        </motion.div>

        {/* ── Stats Row ── */}
        <motion.div
          custom={1}
          initial="hidden"
          animate="visible"
          variants={fadeInUp}
          className="grid grid-cols-3 gap-4"
        >
          {[
            { label: 'Tasks Done', value: doneTasks.length, icon: <CheckCircle2 size={16} />, color: '#10b981' },
            { label: 'Memory Entries', value: memory?.entries.length ?? agent.memoryEntries, icon: <Brain size={16} />, color: '#6366f1' },
            { label: 'Last Active', value: lastEvent ? timeAgo(lastEvent.timestamp) : 'N/A', icon: <Clock size={16} />, color: '#22d3ee' },
          ].map(({ label, value, icon, color }) => (
            <div
              key={label}
              className="rounded-xl p-4 text-center"
              style={{
                background: 'rgba(18,18,26,0.9)',
                backdropFilter: 'blur(12px)',
                border: `1px solid ${color}22`,
                boxShadow: `0 0 16px ${color}11`,
              }}
            >
              <div className="flex justify-center mb-2" style={{ color }}>{icon}</div>
              <div className="text-xl font-bold text-white">{value}</div>
              <div className="text-xs text-slate-500 mt-1">{label}</div>
            </div>
          ))}
        </motion.div>

        {/* ── Current Task ── */}
        {currentTask && (
          <motion.div
            custom={2}
            initial="hidden"
            animate="visible"
            variants={fadeInUp}
          >
            <div className="flex items-center gap-2 mb-3">
              <Zap size={14} className="text-indigo-400" />
              <h2 className="text-xs font-semibold uppercase tracking-widest text-slate-400">Current Task</h2>
            </div>
            <div
              className="rounded-xl p-5"
              style={{
                background: 'rgba(99,102,241,0.08)',
                border: '1px solid rgba(99,102,241,0.25)',
                boxShadow: '0 0 20px rgba(99,102,241,0.1)',
              }}
            >
              <div className="text-xs text-slate-600 font-mono mb-2">{currentTask.id}</div>
              <div className="text-base font-semibold text-white mb-3">{currentTask.title}</div>
              <div className="flex items-center gap-3 flex-wrap">
                <span
                  className="text-xs px-2 py-0.5 rounded-full"
                  style={{ background: 'rgba(99,102,241,0.15)', color: '#818cf8' }}
                >
                  {currentTask.points} pts
                </span>
                <span
                  className="text-xs px-2 py-0.5 rounded-full font-bold"
                  style={{ background: 'rgba(99,102,241,0.2)', color: '#a5b4fc', border: '1px solid rgba(99,102,241,0.3)' }}
                >
                  In Progress
                </span>
                {currentTask.notes && (
                  <span className="text-xs text-slate-500">{currentTask.notes}</span>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* ── Two column: Timeline + Memory ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Activity Timeline */}
          <motion.div custom={3} initial="hidden" animate="visible" variants={fadeInUp}>
            <div className="flex items-center gap-2 mb-4">
              <Clock size={14} className="text-cyan-400" />
              <h2 className="text-xs font-semibold uppercase tracking-widest text-slate-400">Activity Timeline</h2>
            </div>
            {events.length === 0 ? (
              <div
                className="rounded-xl p-6 text-center text-sm text-slate-600 italic"
                style={{ background: 'rgba(18,18,26,0.6)', border: '1px solid rgba(255,255,255,0.05)' }}
              >
                No activity logged
              </div>
            ) : (
              <div className="space-y-0">
                {events.map((event, i) => {
                  const cfg = eventTypeConfig[event.type as keyof typeof eventTypeConfig] ?? eventTypeConfig.COMMENT
                  const isLast = i === events.length - 1
                  return (
                    <div key={event.id} className="timeline-item flex gap-3 pb-4">
                      {/* Left: connector */}
                      <div className="flex flex-col items-center">
                        <div
                          className="w-2.5 h-2.5 rounded-full mt-1 shrink-0"
                          style={{ backgroundColor: cfg.color, boxShadow: `0 0 6px ${cfg.color}88` }}
                        />
                        {!isLast && (
                          <div
                            className="timeline-connector"
                            style={{ backgroundColor: `${cfg.color}30` }}
                          />
                        )}
                      </div>
                      {/* Right: content */}
                      <div
                        className="flex-1 rounded-lg p-3 mb-0"
                        style={{
                          background: 'rgba(18,18,26,0.8)',
                          border: '1px solid rgba(255,255,255,0.06)',
                        }}
                      >
                        <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                          <span
                            className="text-[10px] px-1.5 py-0.5 rounded font-bold tracking-wide"
                            style={{ background: cfg.bg, color: cfg.color }}
                          >
                            {cfg.label}
                          </span>
                          <span className="text-xs text-slate-600">{timeAgo(event.timestamp)}</span>
                          {event.taskId && (
                            <span
                              className="text-[10px] px-1.5 py-0.5 rounded font-mono"
                              style={{ background: 'rgba(255,255,255,0.05)', color: '#64748b' }}
                            >
                              {event.taskId}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-300 leading-relaxed">{event.message}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </motion.div>

          {/* Memory Panel */}
          <motion.div custom={4} initial="hidden" animate="visible" variants={fadeInUp}>
            <div className="flex items-center gap-2 mb-4">
              <Brain size={14} className="text-indigo-400" />
              <h2 className="text-xs font-semibold uppercase tracking-widest text-slate-400">Memory</h2>
              {memory && (
                <span
                  className="ml-auto text-xs px-2 py-0.5 rounded-full"
                  style={{ background: 'rgba(99,102,241,0.15)', color: '#818cf8' }}
                >
                  {memory.entries.length} entries
                </span>
              )}
            </div>
            {!memory || memory.entries.length === 0 ? (
              <div
                className="rounded-xl p-6 text-center text-sm text-slate-600 italic"
                style={{ background: 'rgba(18,18,26,0.6)', border: '1px solid rgba(255,255,255,0.05)' }}
              >
                No memory entries
              </div>
            ) : (
              <div className="space-y-3">
                {memory.entries.map((entry, i) => (
                  <motion.div
                    key={entry.id}
                    custom={i}
                    initial="hidden"
                    animate="visible"
                    variants={fadeInUp}
                    className="rounded-lg p-3"
                    style={{
                      background: 'rgba(18,18,26,0.8)',
                      border: '1px solid rgba(255,255,255,0.06)',
                    }}
                  >
                    <p className="text-xs text-slate-300 leading-relaxed mb-2">{entry.content}</p>
                    <div className="text-[10px] text-slate-600">{timeAgo(entry.timestamp)}</div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        </div>

        {/* ── Chat Panel ── */}
        <motion.div custom={5} initial="hidden" animate="visible" variants={fadeInUp}>
          <AgentChat agentId={agent.id} agentEmoji={agent.emoji} agentName={agent.name} />
        </motion.div>

      </div>
    </div>
  )
}
