import { motion, AnimatePresence } from 'motion/react'
import { type ReactNode, useState, useRef } from 'react'
import CelebrationEffect from './CelebrationEffect'

interface AnimatedTodoItemProps {
  children: (checkboxRef: React.RefObject<HTMLButtonElement | null>) => ReactNode
  isCompleted: boolean
  isRemoving?: boolean
  onRemoveComplete?: () => void
}

export default function AnimatedTodoItem({
  children,
  isCompleted,
  isRemoving = false,
  onRemoveComplete,
}: AnimatedTodoItemProps) {
  const checkboxRef = useRef<HTMLButtonElement>(null)
  const [showCelebration, setShowCelebration] = useState(false)
  const [previousCompleted, setPreviousCompleted] = useState(isCompleted)
  const itemRef = useRef<HTMLDivElement>(null)

  // Detect completion state change
  if (isCompleted !== previousCompleted) {
    setPreviousCompleted(isCompleted)
    if (isCompleted && !previousCompleted) {
      setShowCelebration(true)
    }
  }

  return (
    <AnimatePresence mode="wait" onExitComplete={onRemoveComplete}>
      {!isRemoving && (
        <motion.div
          ref={itemRef}
          layout
          initial={{ 
            opacity: 0, 
            y: -20, 
            scale: 0.9,
            height: 0,
            marginBottom: 0,
          }}
          animate={{ 
            opacity: 1, 
            y: 0, 
            scale: 1,
            height: "auto",
            marginBottom: 12,
          }}
          exit={{
            opacity: 0,
            x: 100,
            scale: 0.9,
            height: 0,
            marginBottom: 0,
            transition: {
              duration: 0.3,
              ease: [0.4, 0, 0.2, 1],
            }
          }}
          transition={{
            type: "spring",
            damping: 25,
            stiffness: 300,
            mass: 0.8,
          }}
          className="relative"
        >
          {/* Completion celebration effect */}
          <AnimatePresence>
            {showCelebration && (
              <CelebrationEffect
                trigger={showCelebration}
                triggerElement={checkboxRef.current || itemRef.current}
                onComplete={() => setShowCelebration(false)}
              />
            )}
          </AnimatePresence>

          {/* Main content with completion animation */}
          <motion.div
            animate={{
              backgroundColor: isCompleted 
                ? "rgba(16, 185, 129, 0.1)" 
                : "transparent",
            }}
            transition={{ duration: 0.3 }}
            className="rounded-lg overflow-hidden"
          >
            {children(checkboxRef)}
          </motion.div>

          {/* Completion checkmark wave effect */}
          <AnimatePresence>
            {isCompleted && (
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ 
                  scale: [0, 1.2, 1], 
                  opacity: [0, 0.8, 0],
                }}
                exit={{ scale: 0, opacity: 0 }}
                transition={{ 
                  duration: 0.5,
                  times: [0, 0.6, 1],
                  ease: "easeOut"
                }}
                className="absolute inset-0 border-2 border-green-400 rounded-lg pointer-events-none"
                style={{
                  boxShadow: '0 0 20px rgba(16, 185, 129, 0.3)',
                }}
              />
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>
  )
}