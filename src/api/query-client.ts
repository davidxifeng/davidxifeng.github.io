import { QueryClient, DefaultOptions } from '@tanstack/react-query';

/**
 * Default options for React Query
 */
const queryConfig: DefaultOptions = {
  queries: {
    // Stale time: How long data is considered fresh (5 minutes)
    staleTime: 5 * 60 * 1000,

    // Cache time: How long unused data stays in cache (10 minutes)
    gcTime: 10 * 60 * 1000,

    // Retry failed requests
    retry: (failureCount, error: any) => {
      // Don't retry on 4xx errors (client errors)
      if (error?.response?.status >= 400 && error?.response?.status < 500) {
        return false;
      }
      // Retry up to 2 times on other errors
      return failureCount < 2;
    },

    // Retry delay with exponential backoff
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),

    // Refetch on window focus in production
    refetchOnWindowFocus: process.env.NODE_ENV === 'production',

    // Don't refetch on mount by default
    refetchOnMount: false,

    // Don't refetch on reconnect
    refetchOnReconnect: false,
  },
  mutations: {
    // Retry mutations once
    retry: 1,

    // Retry delay
    retryDelay: 1000,
  },
};

/**
 * Create and export the Query Client
 * This will be used in the app's root component
 */
export const queryClient = new QueryClient({
  defaultOptions: queryConfig,
});

/**
 * Query keys factory
 * Helps maintain consistent query keys across the app
 */
export const queryKeys = {
  // Example structure - will be expanded based on your API
  all: ['api'] as const,

  // Helper to create scoped keys
  scope: (scope: string) => [...queryKeys.all, scope] as const,

  // Helper to create list keys
  list: (scope: string, filters?: Record<string, any>) =>
    filters ? ([...queryKeys.scope(scope), 'list', filters] as const) : ([...queryKeys.scope(scope), 'list'] as const),

  // Helper to create detail keys
  detail: (scope: string, id: string | number) => [...queryKeys.scope(scope), 'detail', id] as const,
};
