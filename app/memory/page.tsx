'use client'

import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, X } from 'lucide-react'
import { memoryDocuments, type MemoryDocument } from '@/lib/data'

// ─── Category config ──────────────────────────────────────────────────────────
const categoryConfig = {
  'long-term': { label: 'Long-Term', color: '#818cf8', bg: 'rgba(99,102,241,0.15)', border: 'rgba(99,102,241,0.35)' },
  daily:       { label: 'Daily',     color: '#22d3ee', bg: 'rgba(34,211,238,0.12)',  border: 'rgba(34,211,238,0.3)' },
  context:     { label: 'Context',   color: '#fbbf24', bg: 'rgba(251,191,36,0.12)',  border: 'rgba(251,191,36,0.3)' },
  rules:       { label: 'Rules',     color: '#f87171', bg: 'rgba(248,113,113,0.12)', border: 'rgba(248,113,113,0.3)' },
} as const

type Category = keyof typeof categoryConfig | 'all'

// ─── Markdown renderer (simple) ───────────────────────────────────────────────
function renderMarkdown(content: string): React.ReactNode[] {
  const lines = content.split('\n')
  const nodes: React.ReactNode[] = []
  let key = 0

  for (const line of lines) {
    if (line.startsWith('## ')) {
      nodes.push(
        <h2 key={key++} className="text-base font-bold text-white mt-4 mb-2 pb-1" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
          {line.replace('## ', '')}
        </h2>
      )
    } else if (line.startsWith('# ')) {
      nodes.push(
        <h1 key={key++} className="text-lg font-black text-white mt-4 mb-2">
          {line.replace('# ', '')}
        </h1>
      )
    } else if (line.startsWith('- ')) {
      nodes.push(
        <li key={key++} className="text-sm text-slate-300 ml-4 mb-1 list-disc">
          {line.replace('- ', '')}
        </li>
      )
    } else if (line.trim() === '') {
      nodes.push(<div key={key++} className="h-2" />)
    } else {
      nodes.push(
        <p key={key++} className="text-sm text-slate-300 mb-1 leading-relaxed">
          {line}
        </p>
      )
    }
  }
  return nodes
}

// ─── Highlight text ───────────────────────────────────────────────────────────
function highlight(text: string, query: string): React.ReactNode {
  if (!query.trim()) return text
  const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi')
  const parts = text.split(regex)
  return parts.map((part, i) =>
    regex.test(part) ? (
      <mark key={i} style={{ background: 'rgba(251,191,36,0.35)', color: '#fde68a', borderRadius: 2 }}>
        {part}
      </mark>
    ) : (
      part
    )
  )
}

// ─── Document Card ────────────────────────────────────────────────────────────
function DocCard({
  doc,
  query,
  onClick,
}: {
  doc: MemoryDocument
  query: string
  onClick: () => void
}) {
  const cfg = categoryConfig[doc.category]
  const preview = doc.content.replace(/##\s*/g, '').replace(/- /g, '').trim().slice(0, 150)
  const dateFormatted = new Date(doc.date).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className="rounded-xl p-4 cursor-pointer group transition-all duration-200"
      style={{
        background: 'rgba(18,18,26,0.9)',
        backdropFilter: 'blur(12px)',
        border: '1px solid rgba(255,255,255,0.07)',
        boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
      }}
      whileHover={{
        boxShadow: `0 0 20px ${cfg.color}20, 0 4px 16px rgba(0,0,0,0.5)`,
        borderColor: cfg.border,
      }}
      onClick={onClick}
    >
      {/* Category badge + date */}
      <div className="flex items-center justify-between mb-2">
        <span
          className="text-xs font-semibold px-2 py-0.5 rounded-full"
          style={{ backgroundColor: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}` }}
        >
          {cfg.label}
        </span>
        <span className="text-xs text-slate-600">{dateFormatted}</span>
      </div>

      {/* Title */}
      <h3 className="font-bold text-white mb-2 text-sm leading-snug">
        {highlight(doc.title, query)}
      </h3>

      {/* Tags */}
      <div className="flex flex-wrap gap-1 mb-3">
        {doc.tags.map(tag => (
          <span key={tag} className="text-xs px-1.5 py-0.5 rounded" style={{ background: 'rgba(255,255,255,0.06)', color: '#64748b' }}>
            #{highlight(tag, query)}
          </span>
        ))}
      </div>

      {/* Preview */}
      <p className="text-xs text-slate-500 leading-relaxed mb-3">
        {highlight(preview + (doc.content.length > 150 ? '…' : ''), query)}
      </p>

      {/* Read button */}
      <button
        className="text-xs font-semibold px-3 py-1 rounded-full transition-colors"
        style={{ background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}` }}
      >
        Read →
      </button>
    </motion.div>
  )
}

// ─── Modal ────────────────────────────────────────────────────────────────────
function DocModal({ doc, onClose }: { doc: MemoryDocument; onClose: () => void }) {
  const cfg = categoryConfig[doc.category]
  const dateFormatted = new Date(doc.date).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        style={{ background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)' }}
        onClick={onClose}
      >
        <motion.div
          className="relative w-full max-w-2xl max-h-[85vh] overflow-y-auto rounded-2xl p-6"
          initial={{ scale: 0.92, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.92, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 280, damping: 28 }}
          style={{
            background: 'rgba(14,14,22,0.98)',
            border: `1px solid ${cfg.border}`,
            boxShadow: `0 0 60px ${cfg.color}20, 0 24px 80px rgba(0,0,0,0.8)`,
          }}
          onClick={e => e.stopPropagation()}
        >
          {/* Close */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-slate-500 hover:text-slate-300 transition-colors"
          >
            <X size={18} />
          </button>

          {/* Category + date */}
          <div className="flex items-center gap-3 mb-3 flex-wrap">
            <span
              className="text-xs font-semibold px-2 py-0.5 rounded-full"
              style={{ backgroundColor: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}` }}
            >
              {cfg.label}
            </span>
            <span className="text-xs text-slate-500">{dateFormatted}</span>
          </div>

          {/* Title */}
          <h2 className="text-xl font-black text-white mb-3">{doc.title}</h2>

          {/* Tags */}
          <div className="flex flex-wrap gap-1.5 mb-5">
            {doc.tags.map(tag => (
              <span key={tag} className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(255,255,255,0.07)', color: '#94a3b8' }}>
                #{tag}
              </span>
            ))}
          </div>

          {/* Content */}
          <div className="prose-dark">{renderMarkdown(doc.content)}</div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function MemoryPage() {
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState<Category>('all')
  const [selected, setSelected] = useState<MemoryDocument | null>(null)

  const categories: { id: Category; label: string }[] = [
    { id: 'all', label: 'All' },
    { id: 'long-term', label: 'Long-Term' },
    { id: 'daily', label: 'Daily' },
    { id: 'context', label: 'Context' },
    { id: 'rules', label: 'Rules' },
  ]

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: memoryDocuments.length }
    for (const doc of memoryDocuments) {
      c[doc.category] = (c[doc.category] ?? 0) + 1
    }
    return c
  }, [])

  const filtered = useMemo(() => {
    let docs = memoryDocuments
    if (category !== 'all') docs = docs.filter(d => d.category === category)
    if (query.trim()) {
      const q = query.toLowerCase()
      docs = docs.filter(
        d =>
          d.title.toLowerCase().includes(q) ||
          d.content.toLowerCase().includes(q) ||
          d.tags.some(t => t.toLowerCase().includes(q))
      )
    }
    return docs
  }, [category, query])

  return (
    <div
      className="relative min-h-screen"
      style={{ background: 'linear-gradient(135deg, #0a0a0f 0%, #0d0d1a 50%, #0a0f1a 100%)' }}
    >
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

      <div className="relative z-10 max-w-[1400px] mx-auto px-4 sm:px-6 py-6">
        {/* Header */}
        <motion.header
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row sm:items-center gap-4 mb-8 pb-4"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
        >
          <div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight gradient-text">🧠 Memory</h1>
            <p className="text-xs text-slate-500 mt-1">Nova&apos;s curated knowledge base</p>
          </div>
          {/* Search */}
          <div
            className="flex items-center gap-2 px-3 py-2 rounded-xl sm:ml-auto sm:w-72"
            style={{
              background: 'rgba(18,18,26,0.8)',
              border: '1px solid rgba(255,255,255,0.08)',
              backdropFilter: 'blur(12px)',
            }}
          >
            <Search size={15} className="text-slate-500 shrink-0" />
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search memory…"
              className="flex-1 bg-transparent text-sm text-white placeholder-slate-600 outline-none"
            />
            {query && (
              <button onClick={() => setQuery('')} className="text-slate-600 hover:text-slate-400">
                <X size={13} />
              </button>
            )}
          </div>
        </motion.header>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sidebar */}
          <motion.aside
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="lg:w-[240px] shrink-0"
          >
            <div
              className="rounded-xl p-3 sticky top-6"
              style={{
                background: 'rgba(18,18,26,0.8)',
                border: '1px solid rgba(255,255,255,0.07)',
                backdropFilter: 'blur(12px)',
              }}
            >
              <div className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-3 px-2">
                Filter
              </div>
              {categories.map(cat => {
                const isActive = category === cat.id
                const cfg = cat.id !== 'all' ? categoryConfig[cat.id as keyof typeof categoryConfig] : null
                return (
                  <button
                    key={cat.id}
                    onClick={() => setCategory(cat.id)}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150 mb-1"
                    style={{
                      color: isActive ? (cfg?.color ?? '#a5b4fc') : '#94a3b8',
                      background: isActive ? (cfg?.bg ?? 'rgba(99,102,241,0.15)') : 'transparent',
                      border: isActive ? `1px solid ${cfg?.border ?? 'rgba(99,102,241,0.25)'}` : '1px solid transparent',
                    }}
                  >
                    <span>{cat.label}</span>
                    <span
                      className="text-xs font-bold rounded-full px-1.5 py-0.5 min-w-[20px] text-center"
                      style={{
                        background: isActive ? (cfg?.bg ?? 'rgba(99,102,241,0.2)') : 'rgba(255,255,255,0.05)',
                        color: isActive ? (cfg?.color ?? '#a5b4fc') : '#64748b',
                      }}
                    >
                      {counts[cat.id] ?? 0}
                    </span>
                  </button>
                )
              })}
            </div>
          </motion.aside>

          {/* Main grid */}
          <div className="flex-1">
            {filtered.length === 0 ? (
              <div className="text-center py-20 text-slate-600">
                <div className="text-4xl mb-3">🔍</div>
                <p className="text-sm">No documents match your search.</p>
              </div>
            ) : (
              <motion.div
                layout
                className="grid grid-cols-1 md:grid-cols-2 gap-4"
              >
                <AnimatePresence mode="popLayout">
                  {filtered.map(doc => (
                    <DocCard
                      key={doc.id}
                      doc={doc}
                      query={query}
                      onClick={() => setSelected(doc)}
                    />
                  ))}
                </AnimatePresence>
              </motion.div>
            )}
          </div>
        </div>
      </div>

      {/* Modal */}
      {selected && <DocModal doc={selected} onClose={() => setSelected(null)} />}
    </div>
  )
}
