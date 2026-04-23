'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd'
import { AlertTriangle, CheckCircle2, Clock, Inbox, MessageSquare, Plus, X, Zap } from 'lucide-react'
import { getStatCards, sprintData, type Task, type TaskStatus } from '@/lib/data'
import { useBoardStore } from '@/lib/store'

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

// ─── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({
  label,
  value,
  icon,
  color,
  index,
}: {
  label: string
  value: number
  icon: React.ReactNode
  color: string
  index: number
}) {
  return (
    <motion.div
      custom={index}
      initial="hidden"
      animate="visible"
      variants={fadeInUp}
      className="relative flex-1 min-w-[140px] rounded-xl p-4"
      style={{
        background: 'rgba(18,18,26,0.8)',
        backdropFilter: 'blur(12px)',
        border: `1px solid ${color}33`,
        boxShadow: `0 0 20px ${color}22, inset 0 1px 0 rgba(255,255,255,0.05)`,
      }}
    >
      <div className="flex items-center justify-between mb-2">
        <span style={{ color }} className="opacity-80">{icon}</span>
        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color, boxShadow: `0 0 6px ${color}` }} />
      </div>
      <div className="text-3xl font-bold text-white mb-1">{value}</div>
      <div className="text-xs text-slate-400 font-medium uppercase tracking-wider">{label}</div>
    </motion.div>
  )
}

// ─── Comment Section ──────────────────────────────────────────────────────────
interface Comment {
  text: string
  timestamp: string
}

function CommentSection({
  taskId,
  comments,
  onAdd,
}: {
  taskId: string
  comments: Comment[]
  onAdd: (taskId: string, text: string) => void
}) {
  const [draft, setDraft] = useState('')
  return (
    <div
      className="mt-2 rounded-lg p-2"
      style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.05)' }}
    >
      {comments.length === 0 ? (
        <p className="text-xs text-slate-600 italic mb-2">No comments yet.</p>
      ) : (
        <ul className="mb-2 space-y-1">
          {comments.map((c, idx) => {
            const ts = new Date(c.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
            return (
              <li key={idx} className="text-xs text-slate-400">
                <span className="text-slate-600">[{ts}]</span> {c.text}
              </li>
            )
          })}
        </ul>
      )}
      <div className="flex gap-1.5">
        <input
          value={draft}
          onChange={e => setDraft(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter' && draft.trim()) {
              onAdd(taskId, draft.trim())
              setDraft('')
            }
          }}
          placeholder="Add comment…"
          className="flex-1 text-xs rounded px-2 py-1 text-white placeholder-slate-600 outline-none"
          style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
        />
        <button
          onClick={() => {
            if (draft.trim()) {
              onAdd(taskId, draft.trim())
              setDraft('')
            }
          }}
          className="text-xs px-2 py-1 rounded font-medium transition-colors"
          style={{ background: 'rgba(99,102,241,0.3)', color: '#a5b4fc' }}
        >
          Post
        </button>
      </div>
    </div>
  )
}

// ─── Task Card ────────────────────────────────────────────────────────────────
const statusConfig: Record<string, { color: string; bg: string; label: string }> = {
  done: { color: '#10b981', bg: 'rgba(16,185,129,0.1)', label: 'Done' },
  in_progress: { color: '#6366f1', bg: 'rgba(99,102,241,0.1)', label: 'In Progress' },
  inbox: { color: '#94a3b8', bg: 'rgba(148,163,184,0.08)', label: 'Inbox' },
  blocked: { color: '#ef4444', bg: 'rgba(239,68,68,0.1)', label: 'Blocked' },
  waiting_on_sky: { color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', label: 'Waiting' },
  waiting_on_aakash: { color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', label: 'Waiting' },
}

function DraggableTaskCard({
  task,
  index,
  comments,
  onAddComment,
}: {
  task: Task
  index: number
  comments: Comment[]
  onAddComment: (taskId: string, text: string) => void
}) {
  const [showComments, setShowComments] = useState(false)
  const cfg = statusConfig[task.status] ?? statusConfig.inbox
  const isDone = task.status === 'done'
  const agentName = task.agent.split(' ')[0]

  return (
    <Draggable draggableId={task.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className="relative rounded-lg p-3 mb-2 cursor-grab active:cursor-grabbing select-none"
          style={{
            background: snapshot.isDragging ? 'rgba(99,102,241,0.15)' : 'rgba(18,18,26,0.95)',
            backdropFilter: 'blur(8px)',
            border: snapshot.isDragging ? '1px solid rgba(99,102,241,0.5)' : '1px solid rgba(255,255,255,0.06)',
            borderLeft: task.priority ? '3px solid #f59e0b' : undefined,
            boxShadow: snapshot.isDragging
              ? '0 8px 32px rgba(0,0,0,0.6), 0 0 16px rgba(99,102,241,0.3)'
              : '0 2px 6px rgba(0,0,0,0.3)',
            ...provided.draggableProps.style,
          }}
        >
          {isDone && (
            <div className="absolute top-2 right-2 opacity-30" style={{ color: '#10b981' }}>
              <CheckCircle2 size={14} />
            </div>
          )}
          <div className="text-xs text-slate-600 font-mono mb-1">{task.id}</div>
          <div className="text-sm font-medium text-slate-200 leading-snug mb-1 pr-5">{task.title}</div>
          {/* Priority badge */}
          {task.priority && (
            <div
              className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full mb-2"
              style={{ background: 'rgba(245,158,11,0.15)', color: '#f59e0b', border: '1px solid rgba(245,158,11,0.3)' }}
            >
              🔥 Priority
            </div>
          )}
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <span
              className="text-xs px-2 py-0.5 rounded-full font-medium"
              style={{ backgroundColor: 'rgba(99,102,241,0.15)', color: '#818cf8' }}
            >
              {agentName}
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowComments(v => !v)}
                className="flex items-center gap-1 text-xs transition-colors"
                style={{ color: showComments ? '#818cf8' : '#475569' }}
                title="Comments"
              >
                <MessageSquare size={13} />
                {comments.length > 0 && <span>{comments.length}</span>}
              </button>
              <span
                className="text-xs px-2 py-0.5 rounded-full font-bold"
                style={{ backgroundColor: cfg.bg, color: cfg.color, border: `1px solid ${cfg.color}33` }}
              >
                {task.points} pt{task.points !== 1 ? 's' : ''}
              </span>
            </div>
          </div>
          {showComments && (
            <CommentSection taskId={task.id} comments={comments} onAdd={onAddComment} />
          )}
        </div>
      )}
    </Draggable>
  )
}

// ─── Add Task Form ────────────────────────────────────────────────────────────
function AddTaskForm({
  onAdd,
  onCancel,
}: {
  onAdd: (title: string, points: number) => void
  onCancel: () => void
}) {
  const [title, setTitle] = useState('')
  const [points, setPoints] = useState(1)

  return (
    <div
      className="rounded-lg p-2 mt-2"
      style={{ background: 'rgba(18,18,26,0.95)', border: '1px solid rgba(99,102,241,0.3)' }}
    >
      <input
        autoFocus
        value={title}
        onChange={e => setTitle(e.target.value)}
        placeholder="Task title…"
        className="w-full text-sm rounded px-2 py-1.5 text-white placeholder-slate-600 outline-none mb-2"
        style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
        onKeyDown={e => {
          if (e.key === 'Enter' && title.trim()) {
            onAdd(title.trim(), points)
          } else if (e.key === 'Escape') {
            onCancel()
          }
        }}
      />
      <div className="flex items-center gap-2 mb-2">
        <label className="text-xs text-slate-500">Points:</label>
        <input
          type="number"
          min={1}
          max={99}
          value={points}
          onChange={e => setPoints(Math.max(1, parseInt(e.target.value) || 1))}
          className="w-14 text-sm rounded px-2 py-1 text-white outline-none"
          style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
        />
      </div>
      <div className="flex gap-2">
        <button
          onClick={() => title.trim() && onAdd(title.trim(), points)}
          className="flex-1 text-xs py-1.5 rounded font-semibold transition-colors"
          style={{ background: 'rgba(99,102,241,0.3)', color: '#a5b4fc' }}
        >
          Add
        </button>
        <button
          onClick={onCancel}
          className="text-xs px-3 py-1.5 rounded transition-colors"
          style={{ color: '#64748b' }}
        >
          <X size={14} />
        </button>
      </div>
    </div>
  )
}

// ─── Column config ────────────────────────────────────────────────────────────
type ColumnId = 'inbox' | 'in_progress' | 'done' | 'blocked'

const columnConfig: { id: ColumnId; title: string; icon: React.ReactNode; color: string }[] = [
  { id: 'inbox', title: 'Inbox', icon: <Inbox size={13} />, color: '#94a3b8' },
  { id: 'in_progress', title: 'In Progress', icon: <Clock size={13} />, color: '#6366f1' },
  { id: 'done', title: 'Done', icon: <CheckCircle2 size={13} />, color: '#10b981' },
  { id: 'blocked', title: 'Blocked', icon: <AlertTriangle size={13} />, color: '#ef4444' },
]

// Normalize task status to one of the 4 column IDs
function normalizeStatus(status: string): ColumnId {
  if (status === 'done') return 'done'
  if (status === 'in_progress') return 'in_progress'
  if (status === 'blocked' || status === 'waiting_on_sky' || status === 'waiting_on_aakash') return 'blocked'
  return 'inbox'
}

// ─── Kanban Column ────────────────────────────────────────────────────────────
function KanbanColumn({
  col,
  tasks,
  comments,
  onAddComment,
  onAddTask,
  colIndex,
}: {
  col: (typeof columnConfig)[0]
  tasks: Task[]
  comments: Record<string, Comment[]>
  onAddComment: (taskId: string, text: string) => void
  onAddTask: (columnId: ColumnId, title: string, points: number) => void
  colIndex: number
}) {
  const [showForm, setShowForm] = useState(false)

  // Sort: in_progress column → priority tasks first
  const sortedTasks = col.id === 'in_progress'
    ? [...tasks].sort((a, b) => (b.priority ? 1 : 0) - (a.priority ? 1 : 0))
    : tasks

  return (
    <motion.div
      custom={colIndex}
      initial="hidden"
      animate="visible"
      variants={fadeInUp}
      className="flex-1 min-w-[180px] flex flex-col"
    >
      {/* Column header */}
      <div className="flex items-center gap-2 mb-3 px-1">
        <span style={{ color: col.color }}>{col.icon}</span>
        <span className="text-xs font-semibold uppercase tracking-widest text-slate-400">{col.title}</span>
        <span
          className="ml-auto text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center"
          style={{ backgroundColor: `${col.color}22`, color: col.color }}
        >
          {tasks.length}
        </span>
        <button
          onClick={() => setShowForm(v => !v)}
          className="flex items-center justify-center w-5 h-5 rounded-full transition-colors ml-1"
          style={{ background: 'rgba(255,255,255,0.05)', color: '#64748b' }}
          title={`Add task to ${col.title}`}
        >
          <Plus size={12} />
        </button>
      </div>

      {/* Drop zone */}
      <Droppable droppableId={col.id}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className="rounded-xl p-2 min-h-[120px] flex-1 transition-colors duration-200"
            style={{
              background: snapshot.isDraggingOver ? `${col.color}10` : 'rgba(255,255,255,0.02)',
              border: snapshot.isDraggingOver ? `1px solid ${col.color}44` : `1px solid ${col.color}18`,
            }}
          >
            {sortedTasks.length === 0 && !snapshot.isDraggingOver ? (
              <div className="text-xs text-slate-700 text-center py-6 italic">Empty</div>
            ) : (
              sortedTasks.map((task, i) => (
                <DraggableTaskCard
                  key={task.id}
                  task={task}
                  index={i}
                  comments={comments[task.id] ?? []}
                  onAddComment={onAddComment}
                />
              ))
            )}
            {provided.placeholder}
          </div>
        )}
      </Droppable>

      {/* Add task inline form */}
      {showForm && (
        <AddTaskForm
          onAdd={(title, points) => {
            onAddTask(col.id, title, points)
            setShowForm(false)
          }}
          onCancel={() => setShowForm(false)}
        />
      )}
    </motion.div>
  )
}

// ─── Blocker Card ─────────────────────────────────────────────────────────────
function BlockerCard({
  blocker,
  index,
}: {
  blocker: (typeof sprintData.go_live_blockers)[0]
  index: number
}) {
  return (
    <motion.div
      custom={index}
      initial="hidden"
      animate="visible"
      variants={fadeInUp}
      className="rounded-xl p-4 flex-1 min-w-[260px]"
      style={{
        background: 'rgba(239,68,68,0.05)',
        backdropFilter: 'blur(12px)',
        border: '1px solid rgba(239,68,68,0.3)',
        boxShadow: '0 0 16px rgba(239,68,68,0.1)',
      }}
    >
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex-shrink-0">
          <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: '#ef4444' }} />
        </div>
        <div className="flex-1">
          <div className="text-sm font-semibold text-red-300 mb-1">{blocker.title}</div>
          <div className="text-xs text-slate-400 mb-2">
            <span className="text-red-400/70">Impact:</span> {blocker.impact}
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-xs text-slate-500">
              Owner: <span className="text-slate-300 font-medium">{blocker.owner}</span>
            </span>
            <span
              className="text-xs px-2 py-0.5 rounded-full"
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

// ─── Main Dashboard ───────────────────────────────────────────────────────────

let taskCounter = 1000

export default function Dashboard() {
  const stats = getStatCards()

  // Use Zustand store for tasks, comments, and actions
  const storeTasks = useBoardStore(s => s.tasks)
  const storeComments = useBoardStore(s => s.comments)
  const storeMoveTask = useBoardStore(s => s.moveTask)
  const storeAddTask = useBoardStore(s => s.addTask)
  const storeAddComment = useBoardStore(s => s.addComment)

  // Build columns from store tasks
  const columns: Record<ColumnId, Task[]> = { inbox: [], in_progress: [], done: [], blocked: [] }
  for (const task of storeTasks) {
    const col = normalizeStatus(task.status)
    columns[col].push(task)
  }

  // Convert store comments to local Comment[] shape
  const comments: Record<string, Comment[]> = {}
  for (const [taskId, taskComments] of Object.entries(storeComments)) {
    comments[taskId] = taskComments
  }

  function handleAddComment(taskId: string, text: string) {
    storeAddComment(taskId, text)
  }

  function handleAddTask(columnId: ColumnId, title: string, points: number) {
    taskCounter++
    const statusMap: Record<ColumnId, TaskStatus> = {
      in_progress: 'in_progress',
      done: 'done',
      blocked: 'blocked',
      inbox: 'inbox',
    }
    const newTask: Task = {
      id: `ps-new-${taskCounter}`,
      title,
      agent: 'Nova',
      points,
      status: statusMap[columnId],
    }
    storeAddTask(newTask)
  }

  function handleDragEnd(result: DropResult) {
    const { source, destination, draggableId } = result
    if (!destination) return
    if (source.droppableId === destination.droppableId && source.index === destination.index) return

    const dstId = destination.droppableId as ColumnId
    const newStatus: TaskStatus =
      dstId === 'in_progress' ? 'in_progress' :
      dstId === 'done' ? 'done' :
      dstId === 'blocked' ? 'blocked' :
      'inbox'

    storeMoveTask(draggableId, newStatus)
  }

  const now = new Date()
  const dateStr = now.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })

  const totalPoints =
    sprintData.velocity.sprint_1_points_done +
    sprintData.velocity.sprint_1_points_in_progress +
    sprintData.velocity.sprint_1_points_inbox

  const progressPct = Math.round((sprintData.velocity.sprint_1_points_done / totalPoints) * 100)

  const totalTasks = storeTasks.length

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
            <p className="text-xs text-slate-500 mt-1">{sprintData.meta.goal}</p>
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
              Sprint {sprintData.meta.sprint} · Active
            </span>
            <span className="text-xs text-slate-500">{dateStr}</span>
          </div>
        </motion.header>

        {/* ── Velocity Strip ── */}
        <section>
          <div className="flex gap-3 flex-wrap">
            <StatCard label="Done" value={stats.done} icon={<CheckCircle2 size={18} />} color="#10b981" index={0} />
            <StatCard label="In Progress" value={stats.inProgress} icon={<Clock size={18} />} color="#6366f1" index={1} />
            <StatCard label="Inbox" value={stats.inbox} icon={<Inbox size={18} />} color="#94a3b8" index={2} />
            <StatCard label="Blocked" value={stats.blocked} icon={<AlertTriangle size={18} />} color="#ef4444" index={3} />

            <motion.div
              custom={4}
              initial="hidden"
              animate="visible"
              variants={fadeInUp}
              className="flex-[2] min-w-[200px] rounded-xl p-4"
              style={{
                background: 'rgba(18,18,26,0.8)',
                backdropFilter: 'blur(12px)',
                border: '1px solid rgba(255,255,255,0.07)',
                boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.05)',
              }}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider flex items-center gap-1.5">
                  <Zap size={13} className="text-yellow-400" />
                  Sprint Velocity
                </span>
                <span className="text-xs font-bold" style={{ color: '#818cf8' }}>
                  {sprintData.velocity.sprint_1_points_done}/{totalPoints} pts
                </span>
              </div>
              <div className="w-full h-2 rounded-full" style={{ background: 'rgba(255,255,255,0.06)' }}>
                <motion.div
                  className="h-2 rounded-full"
                  style={{
                    background: 'linear-gradient(90deg, #6366f1, #22d3ee)',
                    boxShadow: '0 0 8px rgba(99,102,241,0.5)',
                  }}
                  initial={{ width: 0 }}
                  animate={{ width: `${progressPct}%` }}
                  transition={{ duration: 1.2, delay: 0.5, ease: 'easeOut' }}
                />
              </div>
              <div className="flex justify-between mt-2 text-xs text-slate-600">
                <span>0</span>
                <span className="text-slate-400 font-medium">{progressPct}% complete</span>
                <span>{totalPoints}</span>
              </div>
            </motion.div>
          </div>
        </section>

        {/* ── Sprint Board (full width, drag-and-drop) ── */}
        <section>
          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeIn}
            className="flex items-center gap-2 mb-4"
          >
            <div className="w-3 h-3 rounded-sm" style={{ background: 'linear-gradient(135deg, #6366f1, #22d3ee)' }} />
            <h2 className="text-xs font-semibold uppercase tracking-widest text-slate-400">Sprint Board</h2>
            <span className="ml-auto text-xs text-slate-600">{totalTasks} tasks · drag to move</span>
          </motion.div>

          <DragDropContext onDragEnd={handleDragEnd}>
            <div className="flex gap-3 overflow-x-auto pb-2">
              {columnConfig.map((col, i) => (
                <KanbanColumn
                  key={col.id}
                  col={col}
                  tasks={columns[col.id]}
                  comments={comments}
                  onAddComment={handleAddComment}
                  onAddTask={handleAddTask}
                  colIndex={i}
                />
              ))}
            </div>
          </DragDropContext>
        </section>

        {/* ── Go-Live Blockers ── */}
        {sprintData.go_live_blockers.length > 0 && (
          <section>
            <motion.div
              initial="hidden"
              animate="visible"
              variants={fadeIn}
              className="flex items-center gap-2 mb-4"
            >
              <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: '#ef4444' }} />
              <h2 className="text-xs font-semibold uppercase tracking-widest text-red-400">Go-Live Blockers</h2>
              <span
                className="text-xs px-2 py-0.5 rounded-full ml-1"
                style={{ background: 'rgba(239,68,68,0.15)', color: '#ef4444' }}
              >
                {sprintData.go_live_blockers.length} active
              </span>
            </motion.div>
            <div className="flex gap-3 flex-wrap">
              {sprintData.go_live_blockers.map((b, i) => (
                <BlockerCard key={b.id} blocker={b} index={i} />
              ))}
            </div>
          </section>
        )}

        {/* ── Footer ── */}
        <motion.footer
          initial="hidden"
          animate="visible"
          variants={fadeIn}
          className="text-center py-4 text-xs text-slate-700"
          style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}
        >
          PropSprint · {sprintData.meta.project} · Sprint {sprintData.meta.sprint} · Started {sprintData.meta.started}
        </motion.footer>
      </div>
    </div>
  )
}
