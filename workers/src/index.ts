/**
 * Playground API - Cloudflare Workers Entry Point
 * Built with Hono + Chanfana for OpenAPI documentation
 */

import { fromHono } from 'chanfana'
import { Hono } from 'hono'
import type { Env } from './types'
import { handleOptions, addCorsHeaders } from './utils/response'
import { createLogger } from './middleware/logger'

// Import OpenAPI endpoints
import {
    AuthVerifyCode,
    AuthRegister,
    AuthLogin,
    AuthProfile,
    AuthLogout,
} from './endpoints/auth'

import {
    CommentsList,
    CommentsCreate,
    CommentsUpdate,
    CommentsDelete,
    CommentsLike,
} from './endpoints/comments'

// Import Feed endpoints
import { FeedList, FeedCreate, FeedDelete, FeedLike } from './endpoints/feed'

// Import Analytics endpoints
import {
    AnalyticsTrack,
    AnalyticsStats,
    AnalyticsPopular,
} from './endpoints/analytics'

// Import Admin endpoints
import { AdminComments, AdminCommentStatus } from './endpoints/admin'

// Import middleware (only for reference, not used in OpenAPI routes)
// import { requireAuth, optionalAuth, requireAdmin } from './middleware/auth'

// Create Hono app
const app = new Hono<{ Bindings: Env }>()

// Setup OpenAPI registry
const openapi = fromHono(app, {
    docs_url: '/docs',
    schema: {
        info: {
            title: 'Playground API',
            version: '1.0.0',
            description:
                'A full-featured backend API for static websites using Cloudflare Workers',
        },
        servers: [
            {
                url: 'http://localhost:8787',
                description: 'Local development server',
            },
            {
                url: 'https://playground.d813.workers.dev',
                description: 'Production server',
            },
        ],
    },
})

openapi.registry.registerComponent('securitySchemes', 'bearerAuth', {
    type: 'http',
    scheme: 'bearer',
    bearerFormat: 'JWT',
    description:
        'JWT token authentication. Use the login endpoint to obtain a token.',
})

app.use(
    '*',
    createLogger({
        logHeaders: true,
        logBody: true,
        maxBodyLength: 2000,
        includePaths: ['/api'],
        excludePaths: ['/docs', '/openapi.json'],
    })
)

// Note: Security schemes are now defined directly in route schemas

// Global middleware
app.use('*', async (c, next) => {
    // Handle CORS preflight
    if (c.req.method === 'OPTIONS') {
        return handleOptions(c.env.ALLOWED_ORIGINS)
    }
    await next()

    // Add CORS headers to response
    const response = c.res
    const newResponse = addCorsHeaders(response, c.env.ALLOWED_ORIGINS)
    c.res = newResponse
})

// Health check (non-OpenAPI route)
app.get('/', c => {
    // Simple logging for root endpoint
    console.log(`=== 📥 GET ${c.req.url} ===`)
    console.log(`User-Agent: ${c.req.header('User-Agent') || 'Unknown'}`)
    console.log(`Timestamp: ${new Date().toISOString()}`)

    const response = c.json({
        name: 'Playground API',
        version: '1.0.0',
        status: 'healthy',
        environment: c.env.ENVIRONMENT,
        docs: '/docs',
    })

    console.log(`=== 📤 RESPONSE 200 ===`)
    console.log('')

    return response
})

// ==================== OpenAPI Auth Routes ====================
// Note: TypeScript may show type errors for OpenAPIRoute classes, but they work correctly at runtime
// This is a known limitation of Chanfana's type definitions
openapi.post('/api/auth/verify-code', AuthVerifyCode)
openapi.post('/api/auth/register', AuthRegister)
openapi.post('/api/auth/login', AuthLogin)
openapi.get('/api/auth/me', AuthProfile)
openapi.post('/api/auth/logout', AuthLogout)

// ==================== OpenAPI Comments Routes ====================
openapi.get('/api/comments/:postSlug', CommentsList)
openapi.post('/api/comments', CommentsCreate)
openapi.put('/api/comments/:id', CommentsUpdate)
openapi.delete('/api/comments/:id', CommentsDelete)
openapi.post('/api/comments/:id/like', CommentsLike)

// ==================== OpenAPI Feed Routes ====================
openapi.get('/api/feed', FeedList)
openapi.post('/api/feed', FeedCreate)
openapi.delete('/api/feed/:id', FeedDelete)
openapi.post('/api/feed/:id/like', FeedLike)

// ==================== OpenAPI Analytics Routes ====================
openapi.post('/api/analytics/track', AnalyticsTrack)
openapi.get('/api/analytics/stats', AnalyticsStats)
openapi.get('/api/analytics/popular', AnalyticsPopular)

// ==================== OpenAPI Admin Routes ====================
openapi.get('/api/admin/comments', AdminComments)
openapi.put('/api/admin/comments/:id/status', AdminCommentStatus)

// ==================== Error Handlers ====================
app.notFound(c => {
    return c.json(
        {
            error: 'Not Found',
            message: 'The requested endpoint does not exist',
            status: 404,
        },
        404
    )
})

app.onError((err, c) => {
    console.error('Unhandled error:', err)
    return c.json(
        {
            error: 'Internal Server Error',
            message: err.message || 'An unexpected error occurred',
            status: 500,
        },
        500
    )
})

// Export the Hono app
export default app
