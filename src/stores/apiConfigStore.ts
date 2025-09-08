import { create } from "zustand";
import { persist } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";

export interface APIProvider {
  id: string;
  name: string;
  baseURL: string;
  requiresKey: boolean;
  defaultModel?: string;
  models?: string[];
}

export const API_PROVIDERS: APIProvider[] = [
  {
    id: "lm-studio-proxy",
    name: "LM Studio (via Dev Proxy)",
    baseURL: "/api/lm-studio/v1",
    requiresKey: false,
    defaultModel: "lfm2-vl-1.6b",
    models: ["lfm2-vl-1.6b"],
  },
  {
    id: "lm-studio-cors-proxy",
    name: "LM Studio (via CORS Proxy)",
    baseURL: "http://localhost:8080/api/v1",
    requiresKey: false,
    defaultModel: "lfm2-vl-1.6b",
    models: ["lfm2-vl-1.6b"],
  },
  {
    id: "openai",
    name: "OpenAI",
    baseURL: "https://api.openai.com/v1",
    requiresKey: true,
    defaultModel: "gpt-4o-mini",
    models: ["gpt-4o", "gpt-4o-mini", "gpt-4-turbo", "gpt-3.5-turbo"],
  },
  {
    id: "openrouter",
    name: "OpenRouter",
    baseURL: "https://openrouter.ai/api/v1",
    requiresKey: true,
    defaultModel: "anthropic/claude-3.5-sonnet",
    models: [
      "anthropic/claude-3.5-sonnet",
      "anthropic/claude-3-opus",
      "anthropic/claude-3-haiku",
      "openai/gpt-4o",
      "openai/gpt-4o-mini",
      "meta-llama/llama-3.1-405b-instruct",
      "google/gemini-pro-1.5",
    ],
  },
  {
    id: "custom",
    name: "Custom API",
    baseURL: "",
    requiresKey: true,
    defaultModel: "",
    models: [],
  },
];

export interface APIConfig {
  selectedProviderId: string;
  customBaseURL: string;
  apiKey: string;
  model: string;
  temperature: number;
  maxTokens: number;
  streamEnabled: boolean;
}

export interface APIConfigState extends APIConfig {
  // Computed values
  currentProvider: APIProvider;
  effectiveBaseURL: string;
  effectiveModel: string;
  // Dynamic model loading
  availableModels: string[];
  isLoadingModels: boolean;
  modelsError: string | null;
}

export interface APIConfigActions {
  setProvider: (providerId: string) => void;
  setCustomBaseURL: (url: string) => void;
  setAPIKey: (key: string) => void;
  setModel: (model: string) => void;
  setTemperature: (temp: number) => void;
  setMaxTokens: (tokens: number) => void;
  setStreamEnabled: (enabled: boolean) => void;
  resetToDefaults: () => void;
  getCurrentProvider: () => APIProvider;
  loadAvailableModels: () => Promise<void>;
  setAvailableModels: (models: string[]) => void;
  setModelsLoading: (loading: boolean) => void;
  setModelsError: (error: string | null) => void;
}

const DEFAULT_CONFIG: APIConfig = {
  selectedProviderId: "lm-studio-proxy",
  customBaseURL: "",
  apiKey: "",
  model: "",
  temperature: 0.7,
  maxTokens: 4096,
  streamEnabled: true,
};

export const useAPIConfigStore = create<APIConfigState & APIConfigActions>()(
  persist(
    immer((set, get) => ({
      ...DEFAULT_CONFIG,
      // Dynamic model state
      availableModels: [],
      isLoadingModels: false,
      modelsError: null,

      // Computed values as regular state (initialized)
      currentProvider: API_PROVIDERS.find(p => p.id === DEFAULT_CONFIG.selectedProviderId) || API_PROVIDERS[0],
      effectiveBaseURL: (API_PROVIDERS.find(p => p.id === DEFAULT_CONFIG.selectedProviderId) || API_PROVIDERS[0]).baseURL,
      effectiveModel: DEFAULT_CONFIG.model || (API_PROVIDERS.find(p => p.id === DEFAULT_CONFIG.selectedProviderId) || API_PROVIDERS[0]).defaultModel || "local-model",

      // Actions
      setProvider: (providerId: string) =>
        set((state) => {
          state.selectedProviderId = providerId;
          const newProvider = API_PROVIDERS.find((p) => p.id === providerId);

          // Update computed values immediately
          state.currentProvider = newProvider || API_PROVIDERS[0];
          
          // Update effective base URL
          const baseURL = newProvider?.id === "custom" && state.customBaseURL
            ? state.customBaseURL
            : (newProvider?.baseURL || '');
          state.effectiveBaseURL = baseURL;
          console.log("effectiveBaseURL for provider", newProvider?.id, ":", baseURL);
          
          // Clear previous models when switching provider
          state.availableModels = [];
          state.modelsError = null;
          state.isLoadingModels = false;

          // Set default model for new provider and update effectiveModel
          if (newProvider?.defaultModel) {
            state.model = newProvider.defaultModel;
            state.effectiveModel = newProvider.defaultModel;
          } else {
            state.model = "";
            state.effectiveModel = "local-model";
          }
          
          console.log("effectiveModel calculation:", {
            selectedModel: state.model,
            providerDefault: newProvider?.defaultModel,
            result: state.effectiveModel,
          });

          // Clear API key when switching to LM Studio variants
          if (providerId === "lm-studio" || providerId === "lm-studio-proxy" || providerId === "lm-studio-cors-proxy") {
            state.apiKey = "";
          }
        }),

      setCustomBaseURL: (url: string) =>
        set((state) => {
          state.customBaseURL = url;
          // Update effectiveBaseURL if custom provider is selected
          if (state.currentProvider.id === "custom") {
            state.effectiveBaseURL = url;
            console.log("Updated effectiveBaseURL for custom provider:", url);
          }
        }),

      setAPIKey: (key: string) =>
        set((state) => {
          state.apiKey = key;
        }),

      setModel: (model: string) =>
        set((state) => {
          console.log(
            "setModel called - changing from",
            state.model,
            "to",
            model,
          );
          state.model = model;
          state.effectiveModel = model || state.currentProvider.defaultModel || "local-model";
          console.log("setModel completed - new state.model:", state.model, "effectiveModel:", state.effectiveModel);
        }),

      setTemperature: (temp: number) =>
        set((state) => {
          state.temperature = Math.min(2, Math.max(0, temp));
        }),

      setMaxTokens: (tokens: number) =>
        set((state) => {
          state.maxTokens = Math.min(8192, Math.max(1, tokens));
        }),

      setStreamEnabled: (enabled: boolean) =>
        set((state) => {
          state.streamEnabled = enabled;
        }),

      resetToDefaults: () =>
        set((state) => {
          Object.assign(state, DEFAULT_CONFIG);
        }),

      getCurrentProvider: () => {
        return get().currentProvider;
      },

      loadAvailableModels: async () => {
        const currentState = get();

        // Don't load if already loading
        if (currentState.isLoadingModels) {
          return;
        }

        console.log(
          "Starting to load models for provider:",
          currentState.selectedProviderId,
        );

        set((state) => {
          state.isLoadingModels = true;
          state.modelsError = null;
        });

        try {
          const { apiClient } = await import("@/services/apiClient");
          const models = await apiClient.getAvailableModels();

          console.log("Models loaded:", models);

          set((state) => {
            state.availableModels = models;
            state.isLoadingModels = false;
            // Auto-select first model if current model is empty or not in the list
            if (
              models.length > 0 &&
              (!state.model || !models.includes(state.model))
            ) {
              console.log(
                "Auto-selecting first model:",
                models[0],
                "previous model was:",
                state.model,
              );
              state.model = models[0];
            } else {
              console.log(
                "Keeping existing model:",
                state.model,
                "available models:",
                models,
              );
            }
          });
        } catch (error: any) {
          console.error("Failed to load models:", error);
          set((state) => {
            state.modelsError = error.message || "Failed to load models";
            state.isLoadingModels = false;
            state.availableModels = [];
          });
        }
      },

      setAvailableModels: (models: string[]) =>
        set((state) => {
          state.availableModels = models;
        }),

      setModelsLoading: (loading: boolean) =>
        set((state) => {
          state.isLoadingModels = loading;
        }),

      setModelsError: (error: string | null) =>
        set((state) => {
          state.modelsError = error;
        }),
    })),
    {
      name: "api-config-storage",
      partialize: (state) => ({
        selectedProviderId: state.selectedProviderId,
        customBaseURL: state.customBaseURL,
        apiKey: state.apiKey,
        model: state.model,
        temperature: state.temperature,
        maxTokens: state.maxTokens,
        streamEnabled: state.streamEnabled,
      }),
    },
  ),
);
