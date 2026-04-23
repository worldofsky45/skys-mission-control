'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { Bot, Eye } from 'lucide-react'
import { agentsData, activityLog, agentMemory, getAgentLastActivity } from '@/lib/data'

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.4, ease: 'easeOut' },
  }),
}

const fadeIn = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.4 } },
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

function AgentCard({ agent, index }: { agent: (typeof agentsData)[0]; index: number }) {
  const lastEvent = getAgentLastActivity(agent.id)
  const memoryCount = agentMemory.find(m => m.agentId === agent.id)?.entries.length ?? agent.memoryEntries

  return (
    <motion.div
      custom={index}
      initial="hidden"
      animate="visible"
      variants={fadeInUp}
      className="group relative rounded-2xl p-6 flex flex-col gap-4 transition-all duration-300"
      style={{
        background: 'rgba(18,18,26,0.9)',
        backdropFilter: 'blur(12px)',
        border: '1px solid rgba(255,255,255,0.07)',
        boxShadow: '0 2px 12px rgba(0,0,0,0.4)',
      }}
      whileHover={{
        scale: 1.015,
        boxShadow: '0 0 32px rgba(99,102,241,0.3), 0 4px 20px rgba(0,0,0,0.5)',
        borderColor: 'rgba(99,102,241,0.5)',
      }}
    >
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <span className="text-5xl leading-none">{agent.emoji}</span>
          <div>
            <div className="text-lg font-bold text-white">{agent.name}</div>
            <span
              className="text-xs px-2 py-0.5 rounded-full font-semibold mt-1 inline-block"
              style={{
                background: 'rgba(99,102,241,0.2)',
                color: '#818cf8',
                border: '1px solid rgba(99,102,241,0.3)',
              }}
            >
              {agent.role}
            </span>
          </div>
        </div>
        {/* Status */}
        <div className="flex items-center gap-2">
          <div
            className={`w-2.5 h-2.5 rounded-full ${agent.active ? 'pulse-green' : ''}`}
            style={{
              backgroundColor: agent.active ? '#10b981' : '#4b5563',
              boxShadow: agent.active ? '0 0 8px #10b981' : 'none',
            }}
          />
          <span className="text-xs font-medium" style={{ color: agent.active ? '#10b981' : '#6b7280' }}>
            {agent.active ? 'Active' : 'Idle'}
          </span>
        </div>
      </div>

      {/* Tagline */}
      <p className="text-sm text-slate-400 leading-relaxed">{agent.tagline}</p>

      {/* Meta row */}
      <div className="flex items-center gap-4 text-xs text-slate-500">
        <span className="flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 opacity-60" />
          {memoryCount} memory entries
        </span>
        {lastEvent && (
          <span className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 opacity-60" />
            Last active {timeAgo(lastEvent.timestamp)}
          </span>
        )}
      </div>

      {/* View button */}
      <Link
        href={`/agents/${agent.id}`}
        className="flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-semibold transition-all duration-200 mt-auto"
        style={{
          background: 'rgba(99,102,241,0.15)',
          border: '1px solid rgba(99,102,241,0.3)',
          color: '#a5b4fc',
        }}
      >
        <Eye size={14} />
        View Agent
      </Link>
    </motion.div>
  )
}

export default function AgentsPage() {
  const activeCount = agentsData.filter(a => a.active).length

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

      <div className="relative z-10 max-w-[1200px] mx-auto px-4 sm:px-6 py-8 space-y-8">

        {/* Header */}
        <motion.div initial="hidden" animate="visible" variants={fadeIn}>
          <div className="flex items-center gap-3 mb-2">
            <Bot size={20} className="text-indigo-400" />
            <h1 className="text-2xl font-black tracking-tight gradient-text">Agent Roster</h1>
            <span
              className="ml-2 text-xs px-2.5 py-1 rounded-full font-semibold"
              style={{ background: 'rgba(16,185,129,0.15)', color: '#10b981', border: '1px solid rgba(16,185,129,0.3)' }}
            >
              {activeCount} active
            </span>
          </div>
          <p className="text-sm text-slate-500">
            {agentsData.length} agents in the PropSprint team
          </p>
        </motion.div>

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
          {agentsData.map((agent, i) => (
            <AgentCard key={agent.id} agent={agent} index={i} />
          ))}
        </div>
      </div>
    </div>
  )
}
