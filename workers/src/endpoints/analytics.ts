/**
 * Analytics Endpoints (OpenAPI)
 */

import { OpenAPIRoute, contentJson } from 'chanfana'
import { z } from 'zod'
import type { Context } from 'hono'
import type { Env, User } from '../types'
import {
    TrackPageViewRequestSchema,
    AnalyticsStatsSchema,
    MessageResponseSchema,
    ErrorResponseSchema,
} from '../types/schemas'
import {
    generateId,
    getCurrentTimestamp,
    hashString,
    getCurrentDate,
} from '../utils/validation'
import {
    optionalAuthenticateRequest,
    requireAdmin,
} from '../utils/auth-helpers'

type AppContext = Context<{ Bindings: Env }>

/**
 * POST /api/analytics/track
 * Track a page view (public endpoint, no auth required)
 */
export class AnalyticsTrack extends OpenAPIRoute {
    schema = {
        tags: ['Analytics'],
        summary: 'Track page view',
        description: 'Track a page view for analytics (public endpoint)',
        request: {
            body: {
                content: {
                    'application/json': {
                        schema: TrackPageViewRequestSchema,
                    },
                },
            },
        },
        responses: {
            '201': {
                description: 'Page view tracked successfully',
                ...contentJson(MessageResponseSchema),
            },
        },
    }

    async handle(c: AppContext) {
        const data = await this.getValidatedData<typeof this.schema>()
        const { path, referrer } = data.body
        const user = await optionalAuthenticateRequest(c)

        // Get client info
        const clientIp =
            c.req.header('CF-Connecting-IP') ||
            c.req.header('X-Forwarded-For') ||
            'unknown'
        const userAgent = c.req.header('User-Agent') || 'unknown'
        const country = c.req.header('CF-IPCountry') || 'unknown'

        // Hash IP for privacy
        const ipHash = await hashString(clientIp)

        // Record page view
        const viewId = generateId()
        const now = getCurrentTimestamp()

        await c.env.DB.prepare(
            'INSERT INTO page_views (id, path, user_id, ip_hash, user_agent, referrer, country, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
        )
            .bind(
                viewId,
                path,
                user?.id || null,
                ipHash,
                userAgent,
                referrer || null,
                country,
                now
            )
            .run()

        // Update daily analytics (aggregate)
        const date = getCurrentDate()

        // Get or create daily analytics entry
        const existingAnalytics = await c.env.DB.prepare(
            'SELECT * FROM analytics_daily WHERE date = ? AND path = ?'
        )
            .bind(date, path)
            .first()

        if (existingAnalytics) {
            // Update existing entry
            await c.env.DB.prepare(
                'UPDATE analytics_daily SET views = views + 1 WHERE date = ? AND path = ?'
            )
                .bind(date, path)
                .run()
        } else {
            // Create new entry
            await c.env.DB.prepare(
                'INSERT INTO analytics_daily (date, path, views, unique_visitors) VALUES (?, ?, 1, 1)'
            )
                .bind(date, path)
                .run()
        }

        return Response.json(
            { message: 'Page view tracked successfully' },
            { status: 201 }
        )
    }
}

/**
 * GET /api/analytics/stats
 * Get analytics statistics (admin only)
 */
export class AnalyticsStats extends OpenAPIRoute {
    schema = {
        tags: ['Analytics'],
        summary: 'Get analytics stats',
        description: 'Get comprehensive analytics statistics (admin only)',
        security: [{ BearerAuth: [] }],
        responses: {
            '200': {
                description: 'Analytics statistics',
                ...contentJson(AnalyticsStatsSchema),
            },
            '403': {
                description: 'Forbidden - Admin access required',
                ...contentJson(ErrorResponseSchema),
            },
        },
    }

    async handle(c: AppContext) {
        const result = await requireAdmin(c)

        if ('error' in result) {
            return result.error
        }

        // Get total views
        const totalViewsResult = await c.env.DB.prepare(
            'SELECT COUNT(*) as total FROM page_views'
        ).first<{
            total: number
        }>()

        const totalViews = totalViewsResult?.total || 0

        // Get unique visitors (approximate, based on ip_hash)
        const uniqueVisitorsResult = await c.env.DB.prepare(
            'SELECT COUNT(DISTINCT ip_hash) as total FROM page_views'
        ).first<{ total: number }>()

        const uniqueVisitors = uniqueVisitorsResult?.total || 0

        // Get popular pages
        const { results: popularPages } = await c.env.DB.prepare(
            'SELECT path, COUNT(*) as views FROM page_views GROUP BY path ORDER BY views DESC LIMIT 10'
        ).all<{ path: string; views: number }>()

        // Get daily stats (last 30 days)
        const { results: dailyStats } = await c.env.DB.prepare(
            'SELECT date, SUM(views) as views, SUM(unique_visitors) as unique_visitors FROM analytics_daily GROUP BY date ORDER BY date DESC LIMIT 30'
        ).all<{ date: string; views: number; unique_visitors: number }>()

        const stats = {
            total_views: totalViews,
            unique_visitors: uniqueVisitors,
            popular_pages: popularPages || [],
            daily_stats: dailyStats || [],
        }

        return Response.json(stats)
    }
}

/**
 * GET /api/analytics/popular
 * Get popular pages (public)
 */
export class AnalyticsPopular extends OpenAPIRoute {
    schema = {
        tags: ['Analytics'],
        summary: 'Get popular pages',
        description: 'Get most popular pages based on page views',
        parameters: [
            {
                name: 'limit',
                in: 'query' as const,
                required: false,
                schema: {
                    type: 'integer' as const,
                    default: 10,
                    minimum: 1,
                    maximum: 50,
                },
                description: 'Maximum number of pages to return',
            },
        ],
        responses: {
            '200': {
                description: 'Popular pages list',
                ...contentJson(
                    z.object({
                        popular_pages: z.array(
                            z.object({
                                path: z.string(),
                                views: z.number(),
                            })
                        ),
                    })
                ),
            },
        },
    }

    async handle(c: AppContext) {
        const limit = parseInt(c.req.query('limit') || '10', 10)

        const { results } = await c.env.DB.prepare(
            'SELECT path, SUM(views) as views FROM analytics_daily GROUP BY path ORDER BY views DESC LIMIT ?'
        )
            .bind(Math.min(limit, 50))
            .all<{ path: string; views: number }>()

        return Response.json({ popular_pages: results || [] })
    }
}
