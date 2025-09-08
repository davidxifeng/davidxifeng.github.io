import OpenAI from 'openai'
import { useAPIConfigStore } from '@/stores/apiConfigStore'
import { Message, ReasoningStep } from '@/stores/chatStore'

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export interface StreamResponse {
  content: string
  done: boolean
  reasoning?: ReasoningStep[]
}

export interface APIError {
  message: string
  code: string
  status?: number
}

class APIClientService {
  private getClient(): OpenAI {
    const config = useAPIConfigStore.getState()
    
    // Handle relative URLs for proxy
    let baseURL = config.effectiveBaseURL
    if (baseURL.startsWith('/')) {
      // Convert relative path to absolute URL
      baseURL = `${window.location.origin}${baseURL}`
    }
    
    console.log('Creating OpenAI client with baseURL:', baseURL)
    
    const client = new OpenAI({
      baseURL,
      apiKey: config.currentProvider.requiresKey ? (config.apiKey || 'placeholder') : 'no-key-required',
      dangerouslyAllowBrowser: true // Required for browser usage
    })

    return client
  }

  private formatMessages(messages: Message[]): ChatMessage[] {
    return messages.map(msg => ({
      role: msg.role,
      content: msg.content
    }))
  }

  private parseReasoningFromContent(content: string): { cleanContent: string, reasoning?: ReasoningStep[] } {
    // Look for reasoning blocks in the format:
    // <thinking>...</thinking> or [Reasoning: ...]
    const reasoningPatterns = [
      /<thinking>([\s\S]*?)<\/thinking>/gi,
      /\[Reasoning:([\s\S]*?)\]/gi,
      /\*\*Reasoning:\*\*([\s\S]*?)(?=\n\n|\n\*\*|$)/gi
    ]

    let reasoning: ReasoningStep[] = []
    let cleanContent = content

    reasoningPatterns.forEach(pattern => {
      const matches = content.match(pattern)
      if (matches) {
        matches.forEach((match, index) => {
          const reasoningContent = match
            .replace(/<\/?thinking>/gi, '')
            .replace(/\[Reasoning:\s*/gi, '')
            .replace(/\]/gi, '')
            .replace(/\*\*Reasoning:\*\*/gi, '')
            .trim()

          if (reasoningContent) {
            reasoning.push({
              id: `${Date.now()}-${index}`,
              title: `Analysis ${index + 1}`,
              content: reasoningContent
            })
          }

          // Remove from main content
          cleanContent = cleanContent.replace(match, '').trim()
        })
      }
    })

    return { 
      cleanContent: cleanContent.replace(/\n{3,}/g, '\n\n'), // Clean up extra newlines
      reasoning: reasoning.length > 0 ? reasoning : undefined 
    }
  }

  async sendMessage(messages: Message[]): Promise<{ content: string, reasoning?: ReasoningStep[] }> {
    try {
      const config = useAPIConfigStore.getState()
      const client = this.getClient()
      
      console.log('API Call - Using model:', config.effectiveModel, 'from provider:', config.selectedProviderId)
      console.log('API Call - Base URL:', config.effectiveBaseURL)
      console.log('API Call - Config state:', { model: config.model, effectiveModel: config.effectiveModel, baseURL: config.effectiveBaseURL })
      
      const chatMessages = this.formatMessages(messages)

      const completion = await client.chat.completions.create({
        model: config.effectiveModel,
        messages: chatMessages,
        temperature: config.temperature,
        max_tokens: config.maxTokens,
        stream: false
      })

      const content = completion.choices[0]?.message?.content || ''
      const parsed = this.parseReasoningFromContent(content)

      return {
        content: parsed.cleanContent,
        reasoning: parsed.reasoning
      }

    } catch (error: any) {
      throw this.handleError(error)
    }
  }

  async *sendMessageStream(messages: Message[]): AsyncGenerator<StreamResponse, void, unknown> {
    try {
      const config = useAPIConfigStore.getState()
      const client = this.getClient()
      
      console.log('Stream API Call - Using model:', config.effectiveModel, 'from provider:', config.selectedProviderId)
      console.log('Stream API Call - Base URL:', config.effectiveBaseURL)
      console.log('Stream API Call - Config state:', { model: config.model, effectiveModel: config.effectiveModel, baseURL: config.effectiveBaseURL })
      
      const chatMessages = this.formatMessages(messages)

      const stream = await client.chat.completions.create({
        model: config.effectiveModel,
        messages: chatMessages,
        temperature: config.temperature,
        max_tokens: config.maxTokens,
        stream: true
      })

      let fullContent = ''
      
      for await (const chunk of stream) {
        const delta = chunk.choices[0]?.delta?.content || ''
        
        if (delta) {
          fullContent += delta
          yield {
            content: delta,
            done: false
          }
        }
      }

      // Parse reasoning from final content
      const parsed = this.parseReasoningFromContent(fullContent)
      
      yield {
        content: '',
        done: true,
        reasoning: parsed.reasoning
      }

    } catch (error: any) {
      throw this.handleError(error)
    }
  }

  private handleError(error: any): APIError {
    if (error?.status) {
      // OpenAI API error
      return {
        message: error.message || 'API request failed',
        code: error.code || 'api_error',
        status: error.status
      }
    } else if (error?.code === 'ECONNREFUSED') {
      // Connection refused (e.g., LM Studio not running)
      return {
        message: 'Unable to connect to API. Please check if the service is running.',
        code: 'connection_refused'
      }
    } else if (error?.name === 'TypeError' && error?.message?.includes('fetch')) {
      // Network error
      return {
        message: 'Network error. Please check your internet connection and API URL.',
        code: 'network_error'
      }
    } else {
      // Generic error
      return {
        message: error?.message || 'An unexpected error occurred',
        code: 'unknown_error'
      }
    }
  }

  async testConnection(): Promise<boolean> {
    try {
      const client = this.getClient()

      // Try to list models to test connection
      await client.models.list()
      return true
    } catch (error) {
      console.error('Connection test failed:', error)
      return false
    }
  }

  async getAvailableModels(): Promise<string[]> {
    try {
      const client = this.getClient()
      const models = await client.models.list()
      
      // Filter out embedding models and sort
      const chatModels = models.data
        .filter(model => !model.id.includes('embedding') && !model.id.includes('embed'))
        .map(model => model.id)
        .sort()
      
      return chatModels
    } catch (error) {
      console.error('Failed to fetch models:', error)
      return []
    }
  }
}

export const apiClient = new APIClientService()