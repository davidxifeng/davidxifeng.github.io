/**
 * Authentication helper utilities for OpenAPIRoute endpoints
 */

import type { Context } from 'hono'
import type { Env, User } from '../types'
import { verifyToken } from './jwt'

type AppContext = Context<{ Bindings: Env }>

/**
 * Extract JWT token from Authorization header
 */
function extractToken(authHeader: string | undefined): string | null {
    if (!authHeader) return null
    const parts = authHeader.split(' ')
    if (parts.length !== 2 || parts[0] !== 'Bearer') return null
    return parts[1]
}

/**
 * Authenticate request and return user or null
 * Call this in OpenAPIRoute handle methods that require authentication
 */
export async function authenticateRequest(c: AppContext): Promise<User | null> {
    const authHeader = c.req.header('Authorization')
    const token = extractToken(authHeader)

    if (!token) {
        return null
    }

    try {
        const payload = await verifyToken(token, c.env.JWT_SECRET)
        if (!payload || !payload.sub) {
            return null
        }

        const user = await c.env.DB.prepare('SELECT * FROM users WHERE id = ?')
            .bind(payload.sub)
            .first<User>()

        return user || null
    } catch (error) {
        console.error('Authentication error:', error)
        return null
    }
}

/**
 * Authenticate request and return user, with optional user support
 * Returns null if no auth provided (doesn't throw error)
 */
export async function optionalAuthenticateRequest(
    c: AppContext
): Promise<User | null> {
    const authHeader = c.req.header('Authorization')

    // If no auth header provided, just return null (valid for optional auth)
    if (!authHeader) {
        return null
    }

    // If auth header is provided, validate it
    return authenticateRequest(c)
}

/**
 * Require authentication and return user or error response
 * Use this when authentication is mandatory
 */
export async function requireAuthentication(
    c: AppContext
): Promise<{ user: User } | { error: Response }> {
    const user = await authenticateRequest(c)

    if (!user) {
        return {
            error: Response.json(
                {
                    error: 'Unauthorized',
                    message: 'Authentication required',
                    status: 401,
                },
                { status: 401 }
            ),
        }
    }

    return { user }
}

/**
 * Require admin role and return user or error response
 * Use this when admin privileges are mandatory
 */
export async function requireAdmin(
    c: AppContext
): Promise<{ user: User } | { error: Response }> {
    const user = await authenticateRequest(c)

    if (!user) {
        return {
            error: Response.json(
                {
                    error: 'Unauthorized',
                    message: 'Authentication required',
                    status: 401,
                },
                { status: 401 }
            ),
        }
    }

    if (user.role !== 'admin') {
        return {
            error: Response.json(
                {
                    error: 'Forbidden',
                    message: 'Admin access required',
                    status: 403,
                },
                { status: 403 }
            ),
        }
    }

    return { user }
}
