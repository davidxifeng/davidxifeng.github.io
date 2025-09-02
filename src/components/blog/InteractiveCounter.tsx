import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { motion } from 'motion/react'

interface InteractiveCounterProps {
  initialValue?: number
  title?: string
}

export function InteractiveCounter({ 
  initialValue = 0, 
  title = "交互式计数器" 
}: InteractiveCounterProps) {
  const [count, setCount] = useState(initialValue)

  return (
    <div className="my-8 p-6 bg-gradient-to-r from-blue-600/20 to-purple-600/20 rounded-xl border border-blue-500/30">
      <h3 className="text-xl font-semibold text-white mb-4">{title}</h3>
      
      <div className="flex items-center gap-4">
        <Button
          onClick={() => setCount(count - 1)}
          variant="outline"
          className="border-blue-500 text-blue-300 hover:bg-blue-500/20"
        >
          -1
        </Button>
        
        <motion.div
          key={count}
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="flex items-center justify-center w-16 h-16 rounded-full bg-blue-500/30 border-2 border-blue-400"
        >
          <span className="text-2xl font-bold text-white">{count}</span>
        </motion.div>
        
        <Button
          onClick={() => setCount(count + 1)}
          variant="outline"
          className="border-blue-500 text-blue-300 hover:bg-blue-500/20"
        >
          +1
        </Button>
      </div>
      
      <p className="mt-4 text-sm text-slate-300">
        这是一个嵌入在 MDX 中的 React 组件！当前值：<strong className="text-blue-300">{count}</strong>
      </p>
    </div>
  )
}