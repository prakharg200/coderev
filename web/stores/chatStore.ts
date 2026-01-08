import { defineStore } from 'pinia'
import { ref } from 'vue'
import dayjs from 'dayjs'
import { nanoid } from '../utils/nanoid'

/**
 * Represents a single chat message
 */
export interface ChatMessage {
  uid: string
  role: 'user' | 'assistant'
  content: string
  timestamp: string
  codeContext?: {
    fileName: string
    selection: string
    lineRange: [number, number]
  }
}

/**
 * Request payload for AI chat
 */
export interface AiChatRequest {
  message: string
  context?: {
    fileName: string
    code: string
    lineRange: [number, number]
  }
  history: Array<{ role: 'user' | 'assistant'; content: string }>
}

/**
 * Store for managing AI chat state
 */
export const useChatStore = defineStore('chatStore', () => {
  const messages = ref<ChatMessage[]>([])
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  /**
   * Sends a message to the AI and receives a response
   */
  async function sendMessage(
    content: string,
    context?: {
      fileName: string
      code: string
      lineRange: [number, number]
    }
  ) {
    // Add user message
    const userMessage: ChatMessage = {
      uid: nanoid(),
      role: 'user',
      content,
      timestamp: dayjs.utc().toISOString(),
      codeContext: context ? {
        fileName: context.fileName,
        selection: context.code,
        lineRange: context.lineRange
      } : undefined
    }
    messages.value.push(userMessage)

    isLoading.value = true
    error.value = null

    try {
      // Build history for context (last 10 messages)
      const history = messages.value.slice(-10).map(m => ({
        role: m.role,
        content: m.content
      }))

      const request: AiChatRequest = {
        message: content,
        context,
        history
      }

      // Call Firebase function
      const { getFunctions, httpsCallable } = await import('firebase/functions')
      const functions = getFunctions()
      const aiChatFn = httpsCallable(functions, 'aiChat')

      const response = await aiChatFn(request)
      const data = response.data as { message: string; error?: string }

      if (data.error) {
        throw new Error(data.error)
      }

      // Add assistant message
      const assistantMessage: ChatMessage = {
        uid: nanoid(),
        role: 'assistant',
        content: data.message,
        timestamp: dayjs.utc().toISOString()
      }
      messages.value.push(assistantMessage)

    } catch (e: any) {
      error.value = e.message || 'Failed to get AI response'
      console.error('AI Chat error:', e)
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Clears all chat messages
   */
  function clearChat() {
    messages.value = []
    error.value = null
  }

  return {
    messages,
    isLoading,
    error,
    sendMessage,
    clearChat
  }
})
