import { createFileRoute } from '@tanstack/react-router'
import { useState, useCallback } from 'react'
import { useTodoStore, type Todo } from '@/stores/todoStore'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Trash2, Edit3, Check, X, Plus } from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'
import AnimatedTodoItem from '@/components/AnimatedTodoItem'

export const Route = createFileRoute('/todo')({
  component: TodoApp,
})

function TodoApp() {
  const {
    filteredTodos,
    filter,
    addTodo,
    toggleTodo,
    deleteTodo,
    editTodo,
    clearCompleted,
    setFilter,
    activeCount,
    completedCount,
  } = useTodoStore()

  const [newTodo, setNewTodo] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingText, setEditingText] = useState('')
  const [removingIds, setRemovingIds] = useState<Set<string>>(new Set())
  const todos = filteredTodos()
  
  
  const handleAddTodo = () => {
    if (newTodo.trim()) {
      addTodo(newTodo)
      setNewTodo('')
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAddTodo()
    }
  }

  const handleEditStart = (todo: Todo) => {
    setEditingId(todo.id)
    setEditingText(todo.text)
  }

  const handleEditSave = () => {
    if (editingId) {
      editTodo(editingId, editingText)
      setEditingId(null)
      setEditingText('')
    }
  }

  const handleEditCancel = () => {
    setEditingId(null)
    setEditingText('')
  }

  const handleEditKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleEditSave()
    } else if (e.key === 'Escape') {
      handleEditCancel()
    }
  }

  const handleDelete = useCallback((id: string) => {
    setRemovingIds(prev => new Set([...prev, id]))
  }, [])

  const handleRemoveComplete = useCallback((id: string) => {
    deleteTodo(id)
    setRemovingIds(prev => {
      const newSet = new Set(prev)
      newSet.delete(id)
      return newSet
    })
  }, [deleteTodo])

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            Todo Manager
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300">
            A full-featured todo application showcasing Zustand state management
          </p>
        </div>

        {/* Add New Todo */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <motion.div
                  whileHover={{ scale: 1.1, rotate: 90 }}
                  transition={{ type: "spring", stiffness: 400 }}
                >
                  <Plus className="h-5 w-5" />
                </motion.div>
                Add New Todo
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <Input
                  placeholder="What needs to be done?"
                  value={newTodo}
                  onChange={(e) => setNewTodo(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="flex-1"
                />
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button onClick={handleAddTodo} disabled={!newTodo.trim()}>
                    Add
                  </Button>
                </motion.div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{activeCount()}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Active</div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">{completedCount()}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Completed</div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">{activeCount() + completedCount()}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Total</div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex gap-2">
                <Button
                  variant={filter === 'all' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilter('all')}
                >
                  All
                </Button>
                <Button
                  variant={filter === 'active' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilter('active')}
                >
                  Active
                </Button>
                <Button
                  variant={filter === 'completed' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilter('completed')}
                >
                  Completed
                </Button>
              </div>
              {completedCount() > 0 && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={clearCompleted}
                >
                  Clear Completed
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Todo List */}
        <Card>
          <CardHeader>
            <CardTitle>
              {filter === 'all' && 'All Todos'}
              {filter === 'active' && 'Active Todos'}  
              {filter === 'completed' && 'Completed Todos'}
              {todos.length > 0 && (
                <span className="text-sm font-normal text-gray-500 dark:text-gray-400 ml-2">
                  ({todos.length} {todos.length === 1 ? 'item' : 'items'})
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {todos.length === 0 ? (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center py-8 text-gray-500 dark:text-gray-400"
              >
                {filter === 'all' && 'No todos yet. Add one above!'}
                {filter === 'active' && 'No active todos. Great job! 🎉'}
                {filter === 'completed' && 'No completed todos yet.'}
              </motion.div>
            ) : (
              <AnimatePresence mode="popLayout">
                {todos.map((todo) => (
                  <AnimatedTodoItem
                    key={todo.id}
                    isCompleted={todo.completed}
                    isRemoving={removingIds.has(todo.id)}
                    onRemoveComplete={() => handleRemoveComplete(todo.id)}
                  >
                    {(checkboxRef) => (
                      <div className={`flex items-center gap-3 p-3 rounded-lg border transition-all duration-200 ${
                        todo.completed 
                          ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' 
                          : 'bg-white dark:bg-slate-800 hover:bg-gray-50 dark:hover:bg-slate-700 border-gray-200 dark:border-slate-700'
                      }`}>
                        <motion.div
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          className="p-1 -m-1" // 增加点击区域
                        >
                          <Checkbox
                            ref={checkboxRef}
                            checked={todo.completed}
                            onCheckedChange={() => toggleTodo(todo.id)}
                            className="flex-shrink-0"
                          />
                        </motion.div>
                      
                      {editingId === todo.id ? (
                        <motion.div 
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="flex-1 flex items-center gap-2"
                        >
                          <Input
                            value={editingText}
                            onChange={(e) => setEditingText(e.target.value)}
                            onKeyDown={handleEditKeyDown}
                            className="flex-1"
                            autoFocus
                          />
                          <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                            <Button size="sm" variant="outline" onClick={handleEditSave}>
                              <Check className="h-4 w-4" />
                            </Button>
                          </motion.div>
                          <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                            <Button size="sm" variant="outline" onClick={handleEditCancel}>
                              <X className="h-4 w-4" />
                            </Button>
                          </motion.div>
                        </motion.div>
                      ) : (
                        <motion.div 
                          className="flex items-center gap-3 flex-1"
                          whileHover={{ x: 2 }}
                          transition={{ type: "spring", stiffness: 300, damping: 25 }}
                        >
                          <motion.span
                            className={`flex-1 transition-all duration-300 ${
                              todo.completed 
                                ? 'line-through text-gray-500 dark:text-gray-400' 
                                : 'text-gray-900 dark:text-white'
                            }`}
                            animate={{
                              opacity: todo.completed ? 0.6 : 1,
                            }}
                          >
                            {todo.text}
                          </motion.span>
                          <div className="text-xs text-gray-400 dark:text-gray-500">
                            {todo.updatedAt.toLocaleDateString()}
                          </div>
                          <div className="flex gap-1">
                            <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleEditStart(todo)}
                                className="h-8 w-8 p-0"
                              >
                                <Edit3 className="h-4 w-4" />
                              </Button>
                            </motion.div>
                            <motion.div 
                              whileHover={{ scale: 1.1, rotate: 5 }} 
                              whileTap={{ scale: 0.9 }}
                            >
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleDelete(todo.id)}
                                className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </motion.div>
                          </div>
                        </motion.div>
                      )}
                    </div>
                    )}
                  </AnimatedTodoItem>
                ))}
              </AnimatePresence>
            )}
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-gray-500 dark:text-gray-400">
          Built with React 19, TanStack Router, Zustand, and Shadcn/ui
        </div>
      </div>
    </div>
  )
}