import { createFileRoute } from '@tanstack/react-router'
import { useState, useRef, useEffect } from 'react'
import { Send, Bot, User, ChevronDown, ChevronUp, AlertCircle } from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'
import ReactMarkdown from 'react-markdown'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism'
import { useChatStore, Message, ReasoningStep } from '@/stores/chatStore'
import { useAPIConfigStore } from '@/stores/apiConfigStore'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { APISettings } from '@/components/APISettings'

export const Route = createFileRoute('/chat')({
  component: ChatPage,
})


function ReasoningBlock({ reasoning }: { reasoning: ReasoningStep[] }) {
  const [isExpanded, setIsExpanded] = useState(false)

  return (
    <div className="border border-border/50 rounded-lg mb-4 bg-muted/30">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-4 py-3 flex items-center justify-between text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
      >
        <span className="flex items-center gap-2">
          <Bot className="h-4 w-4" />
          Reasoning ({reasoning.length} steps)
        </span>
        {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
      </button>
      
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-3 space-y-3">
              {reasoning.map((step, index) => (
                <div key={step.id} className="border-l-2 border-primary/20 pl-3">
                  <div className="text-sm font-medium text-foreground mb-1">
                    Step {index + 1}: {step.title}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    <ReactMarkdown
                      components={{
                        code: ({ node, inline, className, children, ...props }: any) => {
                          const match = /language-(\w+)/.exec(className || '')
                          return !inline && match ? (
                            <SyntaxHighlighter
                              style={oneDark as any}
                              language={match[1]}
                              PreTag="div"
                              className="rounded-md text-xs"
                              {...props}
                            >
                              {String(children).replace(/\n$/, '')}
                            </SyntaxHighlighter>
                          ) : (
                            <code className="bg-muted px-1 py-0.5 rounded text-xs" {...props}>
                              {children}
                            </code>
                          )
                        }
                      }}
                    >
                      {step.content}
                    </ReactMarkdown>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === 'user'
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}
    >
      {!isUser && (
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary flex items-center justify-center">
          <Bot className="h-4 w-4 text-primary-foreground" />
        </div>
      )}
      
      <div className={`max-w-[80%] ${isUser ? 'order-first' : ''}`}>
        {message.reasoning && <ReasoningBlock reasoning={message.reasoning} />}
        
        <div className={`rounded-2xl px-4 py-3 ${
          isUser 
            ? 'bg-primary text-primary-foreground ml-auto' 
            : 'bg-muted text-foreground'
        }`}>
          {isUser ? (
            <p className="text-sm">{message.content}</p>
          ) : (
            <div className="prose prose-sm max-w-none dark:prose-invert">
              <ReactMarkdown
                components={{
                  code: ({ node, inline, className, children, ...props }: any) => {
                    const match = /language-(\w+)/.exec(className || '')
                    return !inline && match ? (
                      <SyntaxHighlighter
                        style={oneDark}
                        language={match[1]}
                        PreTag="div"
                        className="rounded-md text-xs my-2"
                        {...props}
                      >
                        {String(children).replace(/\n$/, '')}
                      </SyntaxHighlighter>
                    ) : (
                      <code className="bg-background px-1 py-0.5 rounded text-xs" {...props}>
                        {children}
                      </code>
                    )
                  },
                  p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                  ul: ({ children }) => <ul className="mb-2 pl-4">{children}</ul>,
                  ol: ({ children }) => <ol className="mb-2 pl-4">{children}</ol>,
                  li: ({ children }) => <li className="mb-1">{children}</li>,
                  h1: ({ children }) => <h1 className="text-lg font-bold mb-2">{children}</h1>,
                  h2: ({ children }) => <h2 className="text-base font-bold mb-2">{children}</h2>,
                  h3: ({ children }) => <h3 className="text-sm font-bold mb-2">{children}</h3>,
                }}
              >
                {message.content}
              </ReactMarkdown>
            </div>
          )}
        </div>
        
        <div className={`text-xs text-muted-foreground mt-1 ${isUser ? 'text-right' : ''}`}>
          {message.timestamp.toLocaleTimeString()}
        </div>
      </div>
      
      {isUser && (
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-muted flex items-center justify-center">
          <User className="h-4 w-4 text-muted-foreground" />
        </div>
      )}
    </motion.div>
  )
}

function StreamingMessage({ content }: { content: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex gap-3 justify-start"
    >
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary flex items-center justify-center">
        <Bot className="h-4 w-4 text-primary-foreground" />
      </div>
      <div className="max-w-[80%]">
        <div className="rounded-2xl px-4 py-3 bg-muted text-foreground">
          <div className="prose prose-sm max-w-none dark:prose-invert">
            <ReactMarkdown
              components={{
                code: ({ node, inline, className, children, ...props }: any) => {
                  const match = /language-(\w+)/.exec(className || '')
                  return !inline && match ? (
                    <SyntaxHighlighter
                      style={oneDark as any}
                      language={match[1]}
                      PreTag="div"
                      className="rounded-md text-xs my-2"
                      {...props}
                    >
                      {String(children).replace(/\n$/, '')}
                    </SyntaxHighlighter>
                  ) : (
                    <code className="bg-background px-1 py-0.5 rounded text-xs" {...props}>
                      {children}
                    </code>
                  )
                },
                p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
              }}
            >
              {content}
            </ReactMarkdown>
            <span className="inline-block w-2 h-4 bg-primary animate-pulse ml-1" />
          </div>
        </div>
      </div>
    </motion.div>
  )
}

function ChatPage() {
  const { 
    messages, 
    isLoading, 
    isStreaming, 
    streamingMessage, 
    error,
    sendMessageToAPIStream,
    clearMessages 
  } = useChatStore()
  const { 
    model,
    availableModels,
    effectiveModel,
    setModel,
    loadAvailableModels
  } = useAPIConfigStore()
  const [input, setInput] = useState('')
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight
    }
  }, [messages, streamingMessage])

  // Load models on component mount
  useEffect(() => {
    loadAvailableModels()
  }, [loadAvailableModels])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading || isStreaming) return

    const message = input.trim()
    setInput('')

    try {
      await sendMessageToAPIStream(message)
    } catch (error) {
      console.error('Failed to send message:', error)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  return (
    <div className="fixed inset-x-0 top-14 bottom-0 bg-background flex flex-col overflow-hidden">
      <header className="border-b bg-background/80 backdrop-blur-sm z-10 flex-shrink-0">
        <div className="container mx-auto max-w-4xl px-4 sm:px-6 py-4 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
          <div className="flex-shrink-0">
            <h1 className="text-xl sm:text-2xl font-bold text-foreground">AI Chat</h1>
            <p className="text-sm text-muted-foreground">
              {effectiveModel ? `Using: ${effectiveModel}` : 'Chat with AI assistant'}
            </p>
            <p className="text-xs text-muted-foreground/60 hidden lg:block">
              Selected: {model || 'none'} | Effective: {effectiveModel}
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
            {/* Model Selector */}
            {availableModels.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground hidden lg:block">Model:</span>
                <Select 
                  value={model || effectiveModel} 
                  onValueChange={(newModel) => {
                    console.log('Chat page - Model selection changed from', model, 'to', newModel)
                    setModel(newModel)
                  }}
                >
                  <SelectTrigger className="w-full sm:w-48">
                    <SelectValue placeholder="Select Model" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableModels.map((modelName) => (
                      <SelectItem key={modelName} value={modelName}>
                        <div className="flex flex-col">
                          <span>{modelName}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            
            {messages.length > 0 && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={clearMessages}
                disabled={isLoading || isStreaming}
                className="w-full sm:w-auto"
              >
                Clear Chat
              </Button>
            )}
          </div>
        </div>
      </header>

      <div className="flex-1 min-h-0 overflow-hidden">
        <div className="h-full container mx-auto max-w-4xl flex flex-col">
          <ScrollArea ref={scrollAreaRef} className="flex-1 min-h-0 px-4 sm:px-6">
            <div className="py-4 sm:py-6 space-y-4 sm:space-y-6">
            {/* Error Display */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4"
              >
                <div className="flex items-center gap-2 text-red-800">
                  <AlertCircle className="h-4 w-4" />
                  <span className="font-medium">Error</span>
                </div>
                <p className="text-red-700 mt-1 text-sm">{error}</p>
              </motion.div>
            )}

            <AnimatePresence>
              {messages.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-center py-20"
                >
                  <Bot className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                  <h2 className="text-xl font-semibold text-foreground mb-2">Welcome to AI Chat</h2>
                  <p className="text-muted-foreground">Start a conversation by typing a message below</p>
                  <p className="text-xs text-muted-foreground mt-2">Configure your API settings using the gear icon</p>
                </motion.div>
              ) : (
                messages.map((message) => (
                  <MessageBubble key={message.id} message={message} />
                ))
              )}
            </AnimatePresence>
            
            {/* Streaming Message */}
            {isStreaming && streamingMessage && (
              <StreamingMessage content={streamingMessage} />
            )}
            
            {/* Loading State */}
            {isLoading && !isStreaming && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex gap-3 justify-start"
              >
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                  <Bot className="h-4 w-4 text-primary-foreground" />
                </div>
                <div className="max-w-[80%]">
                  <div className="rounded-2xl px-4 py-3 bg-muted">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" />
                      <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                      <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </div>
          </ScrollArea>

          <div className="border-t bg-background/80 backdrop-blur-sm p-4 sm:p-6 flex-shrink-0">
            <form onSubmit={handleSubmit} className="flex gap-2 sm:gap-3">
              <div className="flex-1 relative">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Type your message..."
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-background border border-border rounded-2xl resize-none focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary max-h-32 text-sm sm:text-base"
                  rows={1}
                  disabled={isLoading || isStreaming}
                />
              </div>
              <Button
                type="submit"
                disabled={!input.trim() || isLoading || isStreaming}
                size="icon"
                className="h-10 w-10 sm:h-12 sm:w-12 rounded-2xl"
              >
                <Send className="h-3 w-3 sm:h-4 sm:w-4" />
              </Button>
            </form>
          </div>
        </div>
      </div>
      
      {/* API Settings */}
      <APISettings />
    </div>
  )
}