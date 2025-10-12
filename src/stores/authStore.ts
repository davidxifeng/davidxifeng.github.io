/**
 * Authentication Store
 * Manages user authentication state and JWT token
 */

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface UserPublic {
  id: string
  email: string
  username: string
  display_name: string | null
  avatar_url: string | null
  bio: string | null
  role: 'admin' | 'user'
  email_verified: boolean
  created_at: number
}

export interface AuthState {
  // State
  user: UserPublic | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean

  // Actions
  setAuth: (token: string, user: UserPublic) => void
  clearAuth: () => void
  updateUser: (user: Partial<UserPublic>) => void
  setLoading: (loading: boolean) => void

  // Computed
  isAdmin: () => boolean
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      // Initial state
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,

      // Actions
      setAuth: (token: string, user: UserPublic) => {
        // Store token in localStorage for axios interceptor
        localStorage.setItem('auth_token', token)

        set({
          user,
          token,
          isAuthenticated: true,
          isLoading: false,
        })
      },

      clearAuth: () => {
        // Remove token from localStorage
        localStorage.removeItem('auth_token')

        set({
          user: null,
          token: null,
          isAuthenticated: false,
          isLoading: false,
        })
      },

      updateUser: (updates: Partial<UserPublic>) => {
        const currentUser = get().user
        if (currentUser) {
          set({
            user: { ...currentUser, ...updates },
          })
        }
      },

      setLoading: (loading: boolean) => {
        set({ isLoading: loading })
      },

      // Computed
      isAdmin: () => {
        const { user } = get()
        return user?.role === 'admin'
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
)

/**
 * Helper function to get authorization header
 */
export function getAuthHeader(): string | undefined {
  const token = useAuthStore.getState().token
  return token ? `Bearer ${token}` : undefined
}
