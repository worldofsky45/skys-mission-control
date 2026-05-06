'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { TrendingUp, Activity, DollarSign, Target } from 'lucide-react'

// ─── Animation variants ───────────────────────────────────────────────────────
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
  visible: { opacity: 1, transition: { duration: 0.5 } },
}

// ─── Paper Trading Section ────────────────────────────────────────────────────
function PaperTradingSection() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch('/api/paper-trading')
        const json = await res.json()
        setData(json)
        setLoading(false)
      } catch (error) {
        console.error('Error fetching paper trading data:', error)
        setLoading(false)
      }
    }

    fetchData()
    const interval = setInterval(fetchData, 60000)
    return () => clearInterval(interval)
  }, [])

  if (loading) return null
  if (!data?.stats) return null

  const { stats, trades } = data
  
  // Ensure stats has all required properties with defaults
  const safeStats = {
    totalPnLPct: stats.totalPnLPct || 0,
    winRate: stats.winRate || 0,
    riskReward: stats.riskReward || 0,
    ...stats
  }
  const activeTrades = trades.filter((t: any) => t.status === 'active').slice(0, 3)
  const pnlColor = safeStats.totalPnLPct >= 0 ? '#10b981' : '#ef4444'

  return (
    <section>
      <motion.div
        initial="hidden"
        animate="visible"
        variants={fadeIn}
        className="flex items-center gap-2 mb-4"
      >
        <div className="w-3 h-3 rounded-sm" style={{ background: 'linear-gradient(135deg, #10b981, #22d3ee)' }} />
        <h2 className="text-xs font-semibold uppercase tracking-widest text-slate-400">Paper Trading Status & P/L</h2>
      </motion.div>

      <div className="flex gap-3 flex-wrap mb-4">
        <motion.div
          custom={0}
          initial="hidden"
          animate="visible"
          variants={fadeInUp}
          className="flex-1 min-w-[140px] rounded-xl p-4"
          style={{
            background: 'rgba(18,18,26,0.8)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(16,185,129,0.3)',
            boxShadow: '0 0 20px rgba(16,185,129,0.15)',
          }}
        >
          <div className="flex items-center justify-between mb-2">
            <TrendingUp size={18} style={{ color: pnlColor }} />
          </div>
          <div className="text-2xl font-bold mb-1" style={{ color: pnlColor }}>
            {safeStats.totalPnLPct >= 0 ? '+' : ''}{safeStats.totalPnLPct.toFixed(2)}%
          </div>
          <div className="text-xs text-slate-400">Total P&L</div>
        </motion.div>

        <motion.div
          custom={1}
          initial="hidden"
          animate="visible"
          variants={fadeInUp}
          className="flex-1 min-w-[140px] rounded-xl p-4"
          style={{
            background: 'rgba(18,18,26,0.8)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(99,102,241,0.3)',
            boxShadow: '0 0 20px rgba(99,102,241,0.15)',
          }}
        >
          <div className="flex items-center justify-between mb-2">
            <Activity size={18} style={{ color: '#6366f1' }} />
          </div>
          <div className="text-2xl font-bold text-white mb-1">{safeStats.winRate.toFixed(0)}%</div>
          <div className="text-xs text-slate-400">Win Rate</div>
        </motion.div>

        <motion.div
          custom={2}
          initial="hidden"
          animate="visible"
          variants={fadeInUp}
          className="flex-1 min-w-[140px] rounded-xl p-4"
          style={{
            background: 'rgba(18,18,26,0.8)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(34,211,238,0.3)',
            boxShadow: '0 0 20px rgba(34,211,238,0.15)',
          }}
        >
          <div className="flex items-center justify-between mb-2">
            <Target size={18} style={{ color: '#22d3ee' }} />
          </div>
          <div className="text-2xl font-bold text-white mb-1">{safeStats.riskReward.toFixed(2)}</div>
          <div className="text-xs text-slate-400">Risk/Reward</div>
        </motion.div>
      </div>

      {activeTrades.length > 0 && (
        <div className="space-y-2">
          {activeTrades.map((trade: any, i: number) => {
            const pnlPct = trade.pnl_pct || 0
            const pnlColor = pnlPct >= 0 ? 'text-emerald-400' : 'text-red-400'
            
            return (
              <motion.div
                key={trade.id}
                custom={i + 3}
                initial="hidden"
                animate="visible"
                variants={fadeInUp}
                className="rounded-lg p-3"
                style={{
                  background: 'rgba(18,18,26,0.6)',
                  border: '1px solid rgba(255,255,255,0.06)',
                }}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="text-sm font-semibold text-slate-200">{trade.asset}</div>
                    <div className="text-xs text-slate-500 mt-0.5">{trade.signal}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-slate-400">Entry: ${trade.entry_price.toLocaleString()}</div>
                    <div className={`text-xs font-semibold ${pnlColor}`}>
                      {pnlPct >= 0 ? '+' : ''}{pnlPct.toFixed(2)}%
                    </div>
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>
      )}
    </section>
  )
}

// ─── Polymarket Section ───────────────────────────────────────────────────────
function PolymarketSection() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch('/api/polymarket-signals')
        const json = await res.json()
        setData(json)
        setLoading(false)
      } catch (error) {
        console.error('Error fetching polymarket data:', error)
        setLoading(false)
      }
    }

    fetchData()
    const interval = setInterval(fetchData, 60000)
    return () => clearInterval(interval)
  }, [])

  if (loading) return null
  if (!data?.stats || !data?.signals) return null

  const { stats, signals } = data

  return (
    <section>
      <motion.div
        initial="hidden"
        animate="visible"
        variants={fadeIn}
        className="flex items-center gap-2 mb-4"
      >
        <div className="w-3 h-3 rounded-sm" style={{ background: 'linear-gradient(135deg, #8b5cf6, #ec4899)' }} />
        <h2 className="text-xs font-semibold uppercase tracking-widest text-slate-400">Polymarket Signals & Performance</h2>
      </motion.div>

      <div className="flex gap-3 flex-wrap mb-4">
        <motion.div
          custom={0}
          initial="hidden"
          animate="visible"
          variants={fadeInUp}
          className="flex-1 min-w-[140px] rounded-xl p-4"
          style={{
            background: 'rgba(18,18,26,0.8)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(139,92,246,0.3)',
            boxShadow: '0 0 20px rgba(139,92,246,0.15)',
          }}
        >
          <div className="text-2xl font-bold text-white mb-1">{stats.activeSignals}</div>
          <div className="text-xs text-slate-400">Active Signals</div>
        </motion.div>

        <motion.div
          custom={1}
          initial="hidden"
          animate="visible"
          variants={fadeInUp}
          className="flex-1 min-w-[140px] rounded-xl p-4"
          style={{
            background: 'rgba(18,18,26,0.8)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(236,72,153,0.3)',
            boxShadow: '0 0 20px rgba(236,72,153,0.15)',
          }}
        >
          <div className="text-2xl font-bold text-white mb-1">{stats.accuracy?.toFixed(1) || '—'}%</div>
          <div className="text-xs text-slate-400">Accuracy</div>
        </motion.div>

        <motion.div
          custom={2}
          initial="hidden"
          animate="visible"
          variants={fadeInUp}
          className="flex-1 min-w-[140px] rounded-xl p-4"
          style={{
            background: 'rgba(18,18,26,0.8)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(16,185,129,0.3)',
            boxShadow: '0 0 20px rgba(16,185,129,0.15)',
          }}
        >
          <div className="text-2xl font-bold text-white mb-1">{stats.totalPnL?.toFixed(2) || '—'}%</div>
          <div className="text-xs text-slate-400">Total P&L</div>
        </motion.div>
      </div>

      {signals.length > 0 && (
        <div className="space-y-2">
          {signals.slice(0, 3).map((signal: any, i: number) => (
            <motion.div
              key={signal.timestamp}
              custom={i + 3}
              initial="hidden"
              animate="visible"
              variants={fadeInUp}
              className="rounded-lg p-3"
              style={{
                background: 'rgba(18,18,26,0.6)',
                border: '1px solid rgba(255,255,255,0.06)',
              }}
            >
              <div className="text-sm font-semibold text-slate-200 mb-1">{signal.market}</div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">{signal.prediction}</span>
                <span className="text-slate-400">Confidence: {signal.confidence}%</span>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </section>
  )
}

// ─── ROI Section ──────────────────────────────────────────────────────────────
function ROISection() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch('/api/roi-tracker')
        const json = await res.json()
        setData(json)
        setLoading(false)
      } catch (error) {
        console.error('Error fetching ROI data:', error)
        setLoading(false)
      }
    }

    fetchData()
    const interval = setInterval(fetchData, 60000)
    return () => clearInterval(interval)
  }, [])

  if (loading) return null
  if (!data?.projects) return null

  const topProjects = data.projects
    .filter((p: any) => p.roi !== 0)
    .sort((a: any, b: any) => b.roi - a.roi)
    .slice(0, 3)

  if (topProjects.length === 0) return null

  return (
    <section>
      <motion.div
        initial="hidden"
        animate="visible"
        variants={fadeIn}
        className="flex items-center gap-2 mb-4"
      >
        <div className="w-3 h-3 rounded-sm" style={{ background: 'linear-gradient(135deg, #f59e0b, #ef4444)' }} />
        <h2 className="text-xs font-semibold uppercase tracking-widest text-slate-400">ROI Tracking</h2>
      </motion.div>

      <div className="flex gap-3 flex-wrap">
        {topProjects.map((project: any, i: number) => {
          const rankColors = ['#fbbf24', '#94a3b8', '#cd7f32']
          const rankLabels = ['🥇', '🥈', '🥉']

          return (
            <motion.div
              key={project.name}
              custom={i}
              initial="hidden"
              animate="visible"
              variants={fadeInUp}
              className="flex-1 min-w-[200px] rounded-xl p-4"
              style={{
                background: 'rgba(18,18,26,0.8)',
                backdropFilter: 'blur(12px)',
                border: `1px solid ${rankColors[i]}33`,
                boxShadow: `0 0 20px ${rankColors[i]}22`,
              }}
            >
              <div className="flex items-start justify-between mb-2">
                <span className="text-lg">{rankLabels[i]}</span>
                <div
                  className="text-xs px-2 py-0.5 rounded-full font-semibold"
                  style={{ background: `${rankColors[i]}22`, color: rankColors[i] }}
                >
                  #{i + 1}
                </div>
              </div>
              <div className="text-sm font-semibold text-slate-200 mb-1">{project.name}</div>
              <div className="flex items-baseline gap-2 mb-1">
                <span className="text-2xl font-bold" style={{ color: rankColors[i] }}>
                  {project.roi >= 0 ? '+' : ''}{project.roi.toFixed(1)}%
                </span>
                <span className="text-xs text-slate-500">ROI</span>
              </div>
              <div className="text-xs text-slate-500">{project.description}</div>
            </motion.div>
          )
        })}
      </div>
    </section>
  )
}

// ─── System Health Section ────────────────────────────────────────────────────
function SystemHealthSection() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch('/api/system-health')
        const json = await res.json()
        setData(json)
        setLoading(false)
      } catch (error) {
        console.error('Error fetching system health:', error)
        setLoading(false)
      }
    }

    fetchData()
    const interval = setInterval(fetchData, 60000)
    return () => clearInterval(interval)
  }, [])

  if (loading) return null
  if (!data) return null

  const isHealthy = data.status === 'healthy'
  const healthColor = isHealthy ? '#10b981' : '#ef4444'

  return (
    <section>
      <motion.div
        initial="hidden"
        animate="visible"
        variants={fadeIn}
        className="flex items-center gap-2 mb-4"
      >
        <div className="w-3 h-3 rounded-sm" style={{ background: `linear-gradient(135deg, ${healthColor}, #22d3ee)` }} />
        <h2 className="text-xs font-semibold uppercase tracking-widest text-slate-400">System Health</h2>
      </motion.div>

      <motion.div
        initial="hidden"
        animate="visible"
        variants={fadeInUp}
        className="rounded-xl p-4"
        style={{
          background: 'rgba(18,18,26,0.8)',
          backdropFilter: 'blur(12px)',
          border: `1px solid ${healthColor}33`,
          boxShadow: `0 0 20px ${healthColor}22`,
        }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: healthColor, boxShadow: `0 0 8px ${healthColor}` }}
          />
          <span className="text-sm font-semibold" style={{ color: healthColor }}>
            {data.status.toUpperCase()}
          </span>
        </div>
        {data.message && (
          <div className="text-xs text-slate-500 mt-2">{data.message}</div>
        )}
      </motion.div>
    </section>
  )
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────
export default function Dashboard() {
  const dateStr = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })

  return (
    <div className="relative min-h-screen" style={{ background: 'linear-gradient(135deg, #0a0a0f 0%, #0d0d1a 50%, #0a0f1a 100%)' }}>
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

      <div className="relative z-10 max-w-[1400px] mx-auto px-4 sm:px-6 py-6 space-y-6">

        {/* ── Header ── */}
        <motion.header
          initial="hidden"
          animate="visible"
          variants={fadeIn}
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
        >
          <div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight gradient-text">
              🚀 Sky&apos;s Mission Control
            </h1>
            <p className="text-xs text-slate-500 mt-1">Real-time Agent Tracking & Performance</p>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <span
              className="flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-full"
              style={{
                background: 'rgba(16,185,129,0.12)',
                border: '1px solid rgba(16,185,129,0.3)',
                color: '#10b981',
              }}
            >
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" style={{ boxShadow: '0 0 6px #10b981' }} />
              Live · Tracking Active
            </span>
            <span className="text-xs text-slate-500">{dateStr}</span>
          </div>
        </motion.header>

        {/* ── Paper Trading Status & P/L ── */}
        <PaperTradingSection />

        {/* ── Polymarket Signals & Performance ── */}
        <PolymarketSection />

        {/* ── ROI Tracking ── */}
        <ROISection />

        {/* ── System Health ── */}
        <SystemHealthSection />

        {/* ── Footer ── */}
        <motion.footer
          initial="hidden"
          animate="visible"
          variants={fadeIn}
          className="text-center py-4 text-xs text-slate-700"
          style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}
        >
          Sky's Mission Control · Real-time Agent Tracking
        </motion.footer>
      </div>
    </div>
  )
}
