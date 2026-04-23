'use client'

import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, ChevronRight, X, Clock, CheckCircle2, AlertCircle } from 'lucide-react'
import { calendarEvents, type CalendarEvent } from '@/lib/data'

// ─── Type config ──────────────────────────────────────────────────────────────
const typeConfig = {
  cron:      { color: '#22d3ee', bg: 'rgba(34,211,238,0.15)',  border: 'rgba(34,211,238,0.3)',  label: 'Cron',      dot: '#22d3ee' },
  task:      { color: '#818cf8', bg: 'rgba(99,102,241,0.15)',  border: 'rgba(99,102,241,0.35)', label: 'Task',      dot: '#818cf8' },
  milestone: { color: '#fbbf24', bg: 'rgba(251,191,36,0.15)',  border: 'rgba(251,191,36,0.3)',  label: 'Milestone', dot: '#fbbf24' },
  review:    { color: '#c084fc', bg: 'rgba(192,132,252,0.15)', border: 'rgba(192,132,252,0.3)', label: 'Review',    dot: '#c084fc' },
} as const

const statusConfig = {
  completed: { icon: <CheckCircle2 size={12} />, color: '#10b981', label: 'Completed' },
  scheduled: { icon: <Clock size={12} />,        color: '#818cf8', label: 'Scheduled' },
  missed:    { icon: <AlertCircle size={12} />,  color: '#ef4444', label: 'Missed'    },
} as const

// Agent emoji map
const agentEmoji: Record<string, string> = {
  Nova: '✨', Forge: '🔨', Sentry: '🛡️', Vaultara: '🔐', Prism: '🔎', Axiom: '🔬', Lex: '⚖️',
}

function getAgentEmoji(agent: string) {
  return agentEmoji[agent] ?? '🤖'
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate()
}

function getFirstDayOfMonth(year: number, month: number) {
  // 0=Sun, shift to Mon=0
  const d = new Date(year, month, 1).getDay()
  return (d + 6) % 7 // Mon-based
}

function isoDate(year: number, month: number, day: number) {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

function formatDate(dateStr: string, timeStr?: string) {
  const d = new Date(dateStr + 'T12:00:00')
  const datePart = d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
  return timeStr ? `${datePart} at ${timeStr}` : datePart
}

function getWeekRange(date: Date) {
  const day = (date.getDay() + 6) % 7 // Mon=0
  const mon = new Date(date)
  mon.setDate(date.getDate() - day)
  const sun = new Date(mon)
  sun.setDate(mon.getDate() + 6)
  return { start: mon, end: sun }
}

function dateInRange(dateStr: string, start: Date, end: Date) {
  const d = new Date(dateStr + 'T12:00:00')
  return d >= start && d <= end
}

// ─── Event Chip ───────────────────────────────────────────────────────────────
function EventChip({ event, onClick }: { event: CalendarEvent; onClick: () => void }) {
  const cfg = typeConfig[event.type]
  const emoji = getAgentEmoji(event.agent)
  const shortTitle = event.title.length > 14 ? event.title.slice(0, 12) + '…' : event.title
  return (
    <button
      onClick={e => { e.stopPropagation(); onClick() }}
      className="w-full text-left text-[10px] px-1 py-0.5 rounded mb-0.5 truncate font-medium transition-opacity hover:opacity-80"
      style={{ backgroundColor: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}` }}
      title={event.title}
    >
      {emoji} {shortTitle}
    </button>
  )
}

// ─── Event Detail Modal ───────────────────────────────────────────────────────
function EventModal({ event, onClose }: { event: CalendarEvent; onClose: () => void }) {
  const tCfg = typeConfig[event.type]
  const sCfg = statusConfig[event.status]
  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)' }}
        onClick={onClose}
      >
        <motion.div
          className="relative w-full max-w-md rounded-2xl p-6"
          initial={{ scale: 0.92, opacity: 0, y: 16 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 28 }}
          style={{
            background: 'rgba(14,14,22,0.98)',
            border: `1px solid ${tCfg.border}`,
            boxShadow: `0 0 60px ${tCfg.color}20, 0 24px 80px rgba(0,0,0,0.8)`,
          }}
          onClick={e => e.stopPropagation()}
        >
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-slate-500 hover:text-slate-300 transition-colors"
          >
            <X size={18} />
          </button>

          {/* Type badge */}
          <div className="flex items-center gap-2 mb-3 flex-wrap">
            <span
              className="text-xs font-semibold px-2 py-0.5 rounded-full"
              style={{ backgroundColor: tCfg.bg, color: tCfg.color, border: `1px solid ${tCfg.border}` }}
            >
              {tCfg.label}
            </span>
            <span
              className="text-xs font-semibold px-2 py-0.5 rounded-full flex items-center gap-1"
              style={{ backgroundColor: `${sCfg.color}18`, color: sCfg.color, border: `1px solid ${sCfg.color}44` }}
            >
              {sCfg.icon}
              {sCfg.label}
            </span>
          </div>

          <h2 className="text-xl font-black text-white mb-2">{event.title}</h2>

          <div className="text-xs text-slate-400 mb-1">
            📅 {formatDate(event.date, event.time)}
          </div>
          <div className="text-xs text-slate-400 mb-4">
            {getAgentEmoji(event.agent)} Agent: <span className="text-slate-200 font-medium">{event.agent}</span>
          </div>

          {event.description && (
            <p className="text-sm text-slate-300 leading-relaxed">{event.description}</p>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

// ─── Right Panel ──────────────────────────────────────────────────────────────
function RightPanel({
  viewDate,
  onSelectEvent,
}: {
  viewDate: Date
  onSelectEvent: (e: CalendarEvent) => void
}) {
  const { start, end } = getWeekRange(viewDate)
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const thisWeek = calendarEvents.filter(e => dateInRange(e.date, start, end))

  const upcoming = calendarEvents
    .filter(e => {
      const d = new Date(e.date + 'T12:00:00')
      return d >= today && e.status === 'scheduled'
    })
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 5)

  function EventRow({ event }: { event: CalendarEvent }) {
    const tCfg = typeConfig[event.type]
    return (
      <button
        onClick={() => onSelectEvent(event)}
        className="w-full text-left flex items-start gap-2 p-2 rounded-lg transition-colors hover:bg-white/5"
      >
        <div className="w-2 h-2 rounded-full mt-1.5 shrink-0" style={{ backgroundColor: tCfg.color }} />
        <div className="flex-1 min-w-0">
          <div className="text-xs font-medium text-slate-200 truncate">{event.title}</div>
          <div className="text-[10px] text-slate-500">{getAgentEmoji(event.agent)} {event.agent} · {event.date}</div>
        </div>
      </button>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      {/* This Week */}
      <div
        className="rounded-xl p-4"
        style={{ background: 'rgba(18,18,26,0.8)', border: '1px solid rgba(255,255,255,0.07)' }}
      >
        <h3 className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-3">This Week</h3>
        {thisWeek.length === 0 ? (
          <p className="text-xs text-slate-700 italic">No events this week.</p>
        ) : (
          thisWeek.map(e => <EventRow key={e.id} event={e} />)
        )}
      </div>

      {/* Upcoming */}
      <div
        className="rounded-xl p-4"
        style={{ background: 'rgba(18,18,26,0.8)', border: '1px solid rgba(255,255,255,0.07)' }}
      >
        <h3 className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-3">Upcoming</h3>
        {upcoming.length === 0 ? (
          <p className="text-xs text-slate-700 italic">No upcoming events.</p>
        ) : (
          upcoming.map(e => <EventRow key={e.id} event={e} />)
        )}
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────
const MONTHS = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
]
const DAYS = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun']

export default function CalendarPage() {
  // Default to April 2026
  const [viewYear, setViewYear] = useState(2026)
  const [viewMonth, setViewMonth] = useState(3) // 0-indexed; 3 = April
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null)

  const today = new Date()
  const todayStr = today.toISOString().slice(0, 10)

  const daysInMonth = getDaysInMonth(viewYear, viewMonth)
  const firstDay = getFirstDayOfMonth(viewYear, viewMonth)

  // Build grid: 6 rows × 7 cols
  const totalCells = Math.ceil((firstDay + daysInMonth) / 7) * 7
  const cells: (number | null)[] = Array.from({ length: totalCells }, (_, i) => {
    const day = i - firstDay + 1
    return day >= 1 && day <= daysInMonth ? day : null
  })

  // Map date → events
  const eventsByDate = useMemo(() => {
    const map: Record<string, CalendarEvent[]> = {}
    for (const evt of calendarEvents) {
      if (!map[evt.date]) map[evt.date] = []
      map[evt.date].push(evt)
    }
    return map
  }, [])

  function prevMonth() {
    if (viewMonth === 0) { setViewYear(y => y - 1); setViewMonth(11) }
    else setViewMonth(m => m - 1)
  }
  function nextMonth() {
    if (viewMonth === 11) { setViewYear(y => y + 1); setViewMonth(0) }
    else setViewMonth(m => m + 1)
  }
  function goToday() {
    setViewYear(today.getFullYear())
    setViewMonth(today.getMonth())
  }

  // For right panel: approximate "view date" as first of month
  const viewDate = new Date(viewYear, viewMonth, 15)

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
          className="flex flex-col sm:flex-row sm:items-center gap-4 mb-6 pb-4"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
        >
          <div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight gradient-text">📅 Calendar</h1>
            <p className="text-xs text-slate-500 mt-1">Nova&apos;s scheduled tasks and events</p>
          </div>

          {/* Month nav */}
          <div className="flex items-center gap-3 sm:ml-auto">
            <button
              onClick={prevMonth}
              className="p-1.5 rounded-lg transition-colors hover:bg-white/5"
              style={{ color: '#64748b' }}
            >
              <ChevronLeft size={18} />
            </button>
            <span className="text-lg font-bold text-white min-w-[160px] text-center">
              {MONTHS[viewMonth]} {viewYear}
            </span>
            <button
              onClick={nextMonth}
              className="p-1.5 rounded-lg transition-colors hover:bg-white/5"
              style={{ color: '#64748b' }}
            >
              <ChevronRight size={18} />
            </button>
            <button
              onClick={goToday}
              className="text-xs px-3 py-1.5 rounded-lg font-medium transition-colors"
              style={{ background: 'rgba(99,102,241,0.2)', color: '#818cf8', border: '1px solid rgba(99,102,241,0.3)' }}
            >
              Today
            </button>
          </div>
        </motion.header>

        {/* Legend */}
        <div className="flex flex-wrap gap-4 mb-5">
          {(Object.entries(typeConfig) as [keyof typeof typeConfig, typeof typeConfig[keyof typeof typeConfig]][]).map(([type, cfg]) => (
            <div key={type} className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: cfg.dot }} />
              <span className="text-xs text-slate-400">{cfg.label}</span>
            </div>
          ))}
        </div>

        <div className="flex flex-col xl:flex-row gap-6">
          {/* Calendar grid */}
          <div className="flex-1">
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl overflow-hidden"
              style={{
                background: 'rgba(14,14,22,0.8)',
                border: '1px solid rgba(255,255,255,0.07)',
                backdropFilter: 'blur(12px)',
              }}
            >
              {/* Day headers */}
              <div className="grid grid-cols-7 border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                {DAYS.map(d => (
                  <div key={d} className="text-center text-xs font-semibold uppercase tracking-widest text-slate-600 py-3">
                    {d}
                  </div>
                ))}
              </div>

              {/* Day cells */}
              <div className="grid grid-cols-7">
                {cells.map((day, idx) => {
                  const dateStr = day ? isoDate(viewYear, viewMonth, day) : ''
                  const events = day ? (eventsByDate[dateStr] ?? []) : []
                  const isToday = dateStr === todayStr
                  const hasEvents = events.length > 0

                  return (
                    <div
                      key={idx}
                      className="min-h-[90px] p-1.5 border-b border-r transition-colors"
                      style={{
                        borderColor: 'rgba(255,255,255,0.04)',
                        background: !day
                          ? 'rgba(0,0,0,0.2)'
                          : hasEvents
                          ? 'rgba(255,255,255,0.015)'
                          : 'transparent',
                      }}
                    >
                      {day && (
                        <>
                          <div
                            className={`text-xs font-bold mb-1 w-6 h-6 flex items-center justify-center rounded-full ml-auto ${
                              isToday ? 'text-white' : 'text-slate-500'
                            }`}
                            style={
                              isToday
                                ? {
                                    background: 'rgba(99,102,241,0.5)',
                                    boxShadow: '0 0 8px rgba(99,102,241,0.6)',
                                    border: '1px solid rgba(99,102,241,0.8)',
                                  }
                                : {}
                            }
                          >
                            {day}
                          </div>
                          <div className="space-y-0.5">
                            {events.slice(0, 3).map(evt => (
                              <EventChip key={evt.id} event={evt} onClick={() => setSelectedEvent(evt)} />
                            ))}
                            {events.length > 3 && (
                              <div className="text-[10px] text-slate-600 pl-1">+{events.length - 3} more</div>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  )
                })}
              </div>
            </motion.div>
          </div>

          {/* Right panel (desktop) */}
          <motion.div
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.15 }}
            className="hidden xl:block w-[280px] shrink-0"
          >
            <RightPanel viewDate={viewDate} onSelectEvent={setSelectedEvent} />
          </motion.div>
        </div>
      </div>

      {/* Event detail modal */}
      {selectedEvent && <EventModal event={selectedEvent} onClose={() => setSelectedEvent(null)} />}
    </div>
  )
}
