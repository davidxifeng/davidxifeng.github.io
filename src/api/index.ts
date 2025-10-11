/**
 * API Client - Unified exports
 *
 * This file provides a single entry point for all API-related functionality
 */

// Core configuration
export { queryClient, queryKeys } from './query-client';
export { axiosInstance, customInstance } from './axios-instance';

// Re-export TanStack Query utilities
export {
  useQuery,
  useMutation,
  useQueryClient,
  type QueryKey,
  type UseMutationOptions,
  type UseQueryOptions,
} from '@tanstack/react-query';

// Generated API exports - available after running: bun run generate:api
export * from './generated/api';

/**
 * Usage Examples:
 *
 * 1. Using generated query hooks:
 * ```tsx
 * import { useGetUsers } from '@/api'
 *
 * function UsersList() {
 *   const { data, isLoading, error } = useGetUsers()
 *   // ...
 * }
 * ```
 *
 * 2. Using generated mutation hooks:
 * ```tsx
 * import { useCreateUser } from '@/api'
 *
 * function CreateUserForm() {
 *   const mutation = useCreateUser()
 *
 *   const handleSubmit = (userData) => {
 *     mutation.mutate(userData, {
 *       onSuccess: (data) => {
 *         console.log('User created:', data)
 *       },
 *       onError: (error) => {
 *         console.error('Failed to create user:', error)
 *       }
 *     })
 *   }
 *   // ...
 * }
 * ```
 *
 * 3. Using query keys for cache management:
 * ```tsx
 * import { useQueryClient, queryKeys } from '@/api'
 *
 * function MyComponent() {
 *   const queryClient = useQueryClient()
 *
 *   const invalidateUsers = () => {
 *     queryClient.invalidateQueries({ queryKey: queryKeys.scope('users') })
 *   }
 *   // ...
 * }
 * ```
 */
