import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'

export interface Todo {
  id: string
  text: string
  completed: boolean
  createdAt: Date
  updatedAt: Date
}

export interface TodoStore {
  todos: Todo[]
  filter: 'all' | 'active' | 'completed'
  
  // Actions
  addTodo: (text: string) => void
  toggleTodo: (id: string) => void
  deleteTodo: (id: string) => void
  editTodo: (id: string, text: string) => void
  clearCompleted: () => void
  setFilter: (filter: 'all' | 'active' | 'completed') => void
  
  // Computed
  filteredTodos: () => Todo[]
  activeCount: () => number
  completedCount: () => number
}

const generateId = () => Math.random().toString(36).substring(2, 9)

export const useTodoStore = create<TodoStore>()(
  immer((set, get) => ({
    todos: [
      {
        id: '1',
        text: 'Learn React 19 features',
        completed: true,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      },
      {
        id: '2', 
        text: 'Build todo app with TanStack Router',
        completed: false,
        createdAt: new Date('2024-01-02'),
        updatedAt: new Date('2024-01-02'),
      },
      {
        id: '3',
        text: 'Add animations with Aceternity UI',
        completed: false,
        createdAt: new Date('2024-01-03'),
        updatedAt: new Date('2024-01-03'),
      },
    ],
    filter: 'all',

    addTodo: (text: string) => {
      const trimmedText = text.trim()
      if (!trimmedText) return
      
      set((state) => {
        state.todos.unshift({
          id: generateId(),
          text: trimmedText,
          completed: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
      })
    },

    toggleTodo: (id: string) => {
      set((state) => {
        const todo = state.todos.find(t => t.id === id)
        if (todo) {
          todo.completed = !todo.completed
          todo.updatedAt = new Date()
        }
      })
    },

    deleteTodo: (id: string) => {
      set((state) => {
        state.todos = state.todos.filter(t => t.id !== id)
      })
    },

    editTodo: (id: string, text: string) => {
      const trimmedText = text.trim()
      if (!trimmedText) return
      
      set((state) => {
        const todo = state.todos.find(t => t.id === id)
        if (todo) {
          todo.text = trimmedText
          todo.updatedAt = new Date()
        }
      })
    },

    clearCompleted: () => {
      set((state) => {
        state.todos = state.todos.filter(t => !t.completed)
      })
    },

    setFilter: (filter: 'all' | 'active' | 'completed') => {
      set((state) => {
        state.filter = filter
      })
    },

    filteredTodos: () => {
      const { todos, filter } = get()
      switch (filter) {
        case 'active':
          return todos.filter(t => !t.completed)
        case 'completed':
          return todos.filter(t => t.completed)
        default:
          return todos
      }
    },

    activeCount: () => {
      return get().todos.filter(t => !t.completed).length
    },

    completedCount: () => {
      return get().todos.filter(t => t.completed).length
    },
  }))
)