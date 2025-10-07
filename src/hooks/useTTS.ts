import { useState, useCallback, useRef } from 'react'

interface TTSOptions {
  lang?: string
  rate?: number
  pitch?: number
  volume?: number
}

export function useTTS() {
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [currentText, setCurrentText] = useState<string>('')
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null)

  const speak = useCallback((text: string, options: TTSOptions = {}) => {
    // 停止当前的朗读
    if (window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel()
    }

    const utterance = new SpeechSynthesisUtterance(text)

    // 设置语言和语音参数
    utterance.lang = options.lang || 'ja-JP'
    utterance.rate = options.rate || 1.0
    utterance.pitch = options.pitch || 1.0
    utterance.volume = options.volume || 1.0

    // 事件处理
    utterance.onstart = () => {
      setIsSpeaking(true)
      setCurrentText(text)
    }

    utterance.onend = () => {
      setIsSpeaking(false)
      setCurrentText('')
    }

    utterance.onerror = (error) => {
      console.error('TTS Error:', error)
      setIsSpeaking(false)
      setCurrentText('')
    }

    utteranceRef.current = utterance
    window.speechSynthesis.speak(utterance)
  }, [])

  const pause = useCallback(() => {
    if (window.speechSynthesis.speaking) {
      window.speechSynthesis.pause()
    }
  }, [])

  const resume = useCallback(() => {
    if (window.speechSynthesis.paused) {
      window.speechSynthesis.resume()
    }
  }, [])

  const stop = useCallback(() => {
    window.speechSynthesis.cancel()
    setIsSpeaking(false)
    setCurrentText('')
  }, [])

  return {
    speak,
    pause,
    resume,
    stop,
    isSpeaking,
    currentText,
  }
}
