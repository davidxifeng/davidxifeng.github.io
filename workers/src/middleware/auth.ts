/**
 * Authentication middleware
 */

import type { Context } from 'hono'
import type { Env, JWTPayload, User } from '../types'
import { verifyToken, extractToken } from '../utils/jwt'
import { Errors } from '../utils/response'

// Extend Context to include user
export interface AuthContext extends Context {
  get user(): User | null
  set user(user: User | null)
}

/**
 * Authentication middleware - requires valid JWT token
 */
export async function requireAuth(c: Context<{ Bindings: Env }>): Promise<Response | void> {
  const authHeader = c.req.header('Authorization')
  const token = extractToken(authHeader)

  if (!token) {
    return Errors.unauthorized('Missing authorization token')
  }

  const payload = await verifyToken(token, c.env.JWT_SECRET)

  if (!payload) {
    return Errors.unauthorized('Invalid or expired token')
  }

  // Fetch user from database
  const user = await c.env.DB.prepare('SELECT * FROM users WHERE id = ?')
    .bind(payload.sub)
    .first<User>()

  if (!user) {
    return Errors.unauthorized('User not found')
  }

  if (!user.email_verified) {
    return Errors.forbidden('Email not verified')
  }

  // Attach user to context
  c.set('user', user)
}

/**
 * Optional authentication - doesn't fail if token is missing
 */
export async function optionalAuth(c: Context<{ Bindings: Env }>): Promise<void> {
  const authHeader = c.req.header('Authorization')
  const token = extractToken(authHeader)

  if (!token) {
    c.set('user', null)
    return
  }

  const payload = await verifyToken(token, c.env.JWT_SECRET)

  if (!payload) {
    c.set('user', null)
    return
  }

  // Fetch user from database
  const user = await c.env.DB.prepare('SELECT * FROM users WHERE id = ?')
    .bind(payload.sub)
    .first<User>()

  c.set('user', user || null)
}

/**
 * Require admin role
 */
export async function requireAdmin(c: Context<{ Bindings: Env }>): Promise<Response | void> {
  const user = c.get('user') as User | null

  if (!user) {
    return Errors.unauthorized('Authentication required')
  }

  if (user.role !== 'admin') {
    return Errors.forbidden('Admin access required')
  }
}

/**
 * Get current user from context
 */
export function getCurrentUser(c: Context): User | null {
  return c.get('user') as User | null
}
