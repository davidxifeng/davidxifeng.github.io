/**
 * Rate limiting middleware
 * Simple in-memory rate limiter (per-worker instance)
 * For production, consider using Durable Objects or KV for distributed rate limiting
 */

import type { Context } from 'hono'
import { Errors } from '../utils/response'
import { hashString } from '../utils/validation'

interface RateLimitRecord {
  count: number
  resetAt: number
}

// In-memory store (per worker instance)
const rateLimitStore = new Map<string, RateLimitRecord>()

// Clean up expired entries every 5 minutes
setInterval(() => {
  const now = Date.now()
  for (const [key, record] of rateLimitStore.entries()) {
    if (record.resetAt < now) {
      rateLimitStore.delete(key)
    }
  }
}, 5 * 60 * 1000)

/**
 * Rate limit middleware
 * @param maxRequests - Maximum requests allowed in window
 * @param windowMs - Time window in milliseconds
 */
export function rateLimit(maxRequests = 100, windowMs = 60 * 1000) {
  return async (c: Context): Promise<Response | void> => {
    // Get client identifier (IP address or user ID)
    const clientIp = c.req.header('CF-Connecting-IP') || c.req.header('X-Forwarded-For') || 'unknown'
    const userId = c.get('user')?.id
    const identifier = userId || clientIp

    // Create hash of identifier for privacy
    const key = await hashString(identifier)

    const now = Date.now()
    const record = rateLimitStore.get(key)

    if (!record || record.resetAt < now) {
      // Create new record or reset expired one
      rateLimitStore.set(key, {
        count: 1,
        resetAt: now + windowMs,
      })
      return
    }

    if (record.count >= maxRequests) {
      const retryAfter = Math.ceil((record.resetAt - now) / 1000)
      const response = Errors.tooManyRequests(
        `Rate limit exceeded. Try again in ${retryAfter} seconds`
      )
      response.headers.set('Retry-After', retryAfter.toString())
      response.headers.set('X-RateLimit-Limit', maxRequests.toString())
      response.headers.set('X-RateLimit-Remaining', '0')
      response.headers.set('X-RateLimit-Reset', record.resetAt.toString())
      return response
    }

    // Increment count
    record.count++
    rateLimitStore.set(key, record)

    // Add rate limit headers
    const remaining = maxRequests - record.count
    c.header('X-RateLimit-Limit', maxRequests.toString())
    c.header('X-RateLimit-Remaining', remaining.toString())
    c.header('X-RateLimit-Reset', record.resetAt.toString())
  }
}

/**
 * Stricter rate limit for sensitive endpoints (login, register, etc.)
 */
export const strictRateLimit = rateLimit(10, 60 * 1000) // 10 requests per minute

/**
 * Normal rate limit for general API endpoints
 */
export const normalRateLimit = rateLimit(100, 60 * 1000) // 100 requests per minute
