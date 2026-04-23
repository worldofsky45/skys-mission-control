import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { sprintData, type Task, type TaskStatus } from './data'

export type DecisionAction = 'approved' | 'deferred' | 'rejected'

export interface TaskDecision {
  taskId: string
  action: DecisionAction
  timestamp: string
  previousStatus: TaskStatus
}

interface BoardStore {
  // Tasks with overridden statuses
  tasks: Task[]
  decisions: TaskDecision[]
  comments: Record<string, { text: string; timestamp: string }[]>

  // Actions
  approveTask: (taskId: string) => void
  deferTask: (taskId: string) => void
  rejectTask: (taskId: string) => void
  moveTask: (taskId: string, newStatus: TaskStatus) => void
  addTask: (task: Task) => void
  addComment: (taskId: string, comment: string) => void
}

export const useBoardStore = create<BoardStore>()(
  persist(
    (set) => ({
      tasks: sprintData.tasks.map(t => ({ ...t })),
      decisions: [],
      comments: {},

      approveTask: (taskId) => set((state) => {
        const tasks = state.tasks.map(t => {
          if (t.id !== taskId) return t
          // Approved → move to in_progress, mark as priority
          return { ...t, status: 'in_progress' as TaskStatus, priority: true }
        })
        const task = state.tasks.find(t => t.id === taskId)
        const decisions = [...state.decisions, {
          taskId,
          action: 'approved' as DecisionAction,
          timestamp: new Date().toISOString(),
          previousStatus: task?.status ?? 'inbox'
        }]
        return { tasks, decisions }
      }),

      deferTask: (taskId) => set((state) => {
        const tasks = state.tasks.map(t =>
          t.id === taskId ? { ...t, status: 'inbox' as TaskStatus } : t
        )
        const task = state.tasks.find(t => t.id === taskId)
        const decisions = [...state.decisions, {
          taskId,
          action: 'deferred' as DecisionAction,
          timestamp: new Date().toISOString(),
          previousStatus: task?.status ?? 'inbox'
        }]
        return { tasks, decisions }
      }),

      rejectTask: (taskId) => set((state) => {
        // Remove from board entirely
        const tasks = state.tasks.filter(t => t.id !== taskId)
        const task = state.tasks.find(t => t.id === taskId)
        const decisions = [...state.decisions, {
          taskId,
          action: 'rejected' as DecisionAction,
          timestamp: new Date().toISOString(),
          previousStatus: task?.status ?? 'inbox'
        }]
        return { tasks, decisions }
      }),

      moveTask: (taskId, newStatus) => set((state) => ({
        tasks: state.tasks.map(t =>
          t.id === taskId ? { ...t, status: newStatus } : t
        )
      })),

      addTask: (task) => set((state) => ({
        tasks: [...state.tasks, task]
      })),

      addComment: (taskId, comment) => set((state) => ({
        comments: {
          ...state.comments,
          [taskId]: [
            ...(state.comments[taskId] ?? []),
            { text: comment, timestamp: new Date().toISOString() }
          ]
        }
      })),
    }),
    {
      name: 'mission-control-board', // persists to localStorage
      partialize: (state) => ({
        tasks: state.tasks,
        decisions: state.decisions,
        comments: state.comments
      }),
    }
  )
)
