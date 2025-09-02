import { motion } from 'motion/react'
import { useEffect, useState } from 'react'

export interface TypewriterEffectProps {
  words: Array<{
    text: string
    className?: string
  }>
  className?: string
  cursorClassName?: string
}

export function TypewriterEffect({
  words,
  className,
  cursorClassName
}: TypewriterEffectProps) {
  const [currentWordIndex, setCurrentWordIndex] = useState(0)
  const [currentText, setCurrentText] = useState('')
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    const word = words[currentWordIndex]?.text || ''
    
    const timeout = setTimeout(() => {
      if (!isDeleting) {
        if (currentText.length < word.length) {
          setCurrentText(word.slice(0, currentText.length + 1))
        } else {
          setTimeout(() => setIsDeleting(true), 1000)
        }
      } else {
        if (currentText.length > 0) {
          setCurrentText(currentText.slice(0, -1))
        } else {
          setIsDeleting(false)
          setCurrentWordIndex((prev) => (prev + 1) % words.length)
        }
      }
    }, isDeleting ? 50 : 100)

    return () => clearTimeout(timeout)
  }, [currentText, isDeleting, currentWordIndex, words])

  return (
    <div className={`flex items-center space-x-1 ${className}`}>
      <span className="text-base sm:text-xl md:text-3xl lg:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-b from-neutral-50 to-neutral-400 bg-opacity-50">
        {currentText}
      </span>
      <motion.span
        animate={{
          opacity: [0, 1, 0],
        }}
        transition={{
          duration: 1,
          repeat: Infinity,
          repeatType: 'reverse',
        }}
        className={`inline-block h-4 w-[1px] sm:h-6 xl:h-12 bg-blue-500 ${cursorClassName}`}
      ></motion.span>
    </div>
  )
}