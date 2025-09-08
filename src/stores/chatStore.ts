import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import { apiClient, APIError } from "@/services/apiClient";

export interface ReasoningStep {
  id: string;
  title: string;
  content: string;
}

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  reasoning?: ReasoningStep[];
  timestamp: Date;
}

export interface ChatState {
  messages: Message[];
  isLoading: boolean;
  isStreaming: boolean;
  streamingMessage: string;
  currentConversationId: string | null;
  error: string | null;
}

export interface ChatActions {
  addMessage: (message: Message) => void;
  clearMessages: () => void;
  setLoading: (loading: boolean) => void;
  setStreaming: (streaming: boolean) => void;
  setStreamingMessage: (message: string) => void;
  setError: (error: string | null) => void;
  updateMessage: (id: string, updates: Partial<Message>) => void;
  deleteMessage: (id: string) => void;
  startNewConversation: () => void;
  sendMessageToAPI: (userMessage: string) => Promise<void>;
  sendMessageToAPIStream: (userMessage: string) => Promise<void>;
}

export const useChatStore = create<ChatState & ChatActions>()(
  immer((set, get) => ({
    // State
    messages: [],
    isLoading: false,
    isStreaming: false,
    streamingMessage: "",
    currentConversationId: null,
    error: null,

    // Actions
    addMessage: (message: Message) =>
      set((state) => {
        state.messages.push(message);
        state.isLoading = false;
      }),

    clearMessages: () =>
      set((state) => {
        state.messages = [];
        state.isLoading = false;
      }),

    setLoading: (loading: boolean) =>
      set((state) => {
        state.isLoading = loading;
      }),

    setStreaming: (streaming: boolean) =>
      set((state) => {
        state.isStreaming = streaming;
      }),

    setStreamingMessage: (message: string) =>
      set((state) => {
        state.streamingMessage = message;
      }),

    setError: (error: string | null) =>
      set((state) => {
        state.error = error;
      }),

    updateMessage: (id: string, updates: Partial<Message>) =>
      set((state) => {
        const messageIndex = state.messages.findIndex((m) => m.id === id);
        if (messageIndex !== -1) {
          Object.assign(state.messages[messageIndex], updates);
        }
      }),

    deleteMessage: (id: string) =>
      set((state) => {
        state.messages = state.messages.filter((m) => m.id !== id);
      }),

    startNewConversation: () =>
      set((state) => {
        state.messages = [];
        state.currentConversationId = Date.now().toString();
        state.isLoading = false;
        state.error = null;
      }),

    sendMessageToAPI: async (userMessage: string) => {
      const userMessageObj: Message = {
        id: Date.now().toString(),
        role: "user",
        content: userMessage.trim(),
        timestamp: new Date(),
      };

      // Add user message immediately
      set((state) => {
        state.messages.push(userMessageObj);
        state.isLoading = true;
        state.error = null;
      });

      try {
        const response = await apiClient.sendMessage(get().messages);

        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: response.content,
          reasoning: response.reasoning,
          timestamp: new Date(),
        };

        set((state) => {
          state.messages.push(assistantMessage);
          state.isLoading = false;
        });
      } catch (error: any) {
        const apiError = error as APIError;
        set((state) => {
          state.error = apiError.message;
          state.isLoading = false;
        });
      }
    },

    sendMessageToAPIStream: async (userMessage: string) => {
      const userMessageObj: Message = {
        id: Date.now().toString(),
        role: "user",
        content: userMessage.trim(),
        timestamp: new Date(),
      };

      // Add user message immediately
      set((state) => {
        state.messages.push(userMessageObj);
        state.isStreaming = true;
        state.streamingMessage = "";
        state.error = null;
      });

      try {
        let accumulatedContent = "";
        let finalReasoning: ReasoningStep[] | undefined;

        for await (const chunk of apiClient.sendMessageStream(get().messages)) {
          if (chunk.done) {
            finalReasoning = chunk.reasoning;
            break;
          }

          accumulatedContent += chunk.content;

          set((state) => {
            state.streamingMessage = accumulatedContent;
          });
        }

        // Create final assistant message
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: accumulatedContent,
          reasoning: finalReasoning,
          timestamp: new Date(),
        };

        set((state) => {
          state.messages.push(assistantMessage);
          state.isStreaming = false;
          state.streamingMessage = "";
        });
      } catch (error: any) {
        const apiError = error as APIError;
        set((state) => {
          state.error = apiError.message;
          state.isStreaming = false;
          state.streamingMessage = "";
        });
      }
    },
  })),
);
