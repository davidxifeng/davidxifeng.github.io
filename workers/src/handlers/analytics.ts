/**
 * Analytics handlers - Page view tracking and statistics
 */

import type { Context } from 'hono'
import type { Env, TrackPageViewRequest, AnalyticsStats } from '../types'
import { jsonResponse, Errors } from '../utils/response'
import { getCurrentUser } from '../middleware/auth'
import { generateId, getCurrentTimestamp, hashString, getCurrentDate } from '../utils/validation'

/**
 * POST /api/analytics/track
 * Track a page view (public endpoint, no auth required)
 */
export async function trackPageView(c: Context<{ Bindings: Env }>): Promise<Response> {
  try {
    const body = await c.req.json<TrackPageViewRequest>()
    const { path, referrer } = body
    const user = getCurrentUser(c)

    // Get client info
    const clientIp = c.req.header('CF-Connecting-IP') || c.req.header('X-Forwarded-For') || 'unknown'
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
      .bind(viewId, path, user?.id || null, ipHash, userAgent, referrer || null, country, now)
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

    return jsonResponse({ message: 'Page view tracked successfully' }, 201)
  } catch (error) {
    console.error('Track page view error:', error)
    // Don't fail the request if tracking fails
    return jsonResponse({ message: 'Tracking failed, but request continued' })
  }
}

/**
 * GET /api/analytics/stats
 * Get analytics statistics (admin only)
 */
export async function getAnalyticsStats(c: Context<{ Bindings: Env }>): Promise<Response> {
  try {
    const user = getCurrentUser(c)

    if (!user || user.role !== 'admin') {
      return Errors.forbidden('Admin access required')
    }

    // Get total views
    const totalViewsResult = await c.env.DB.prepare('SELECT COUNT(*) as total FROM page_views')
      .first<{ total: number }>()

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

    const stats: AnalyticsStats = {
      total_views: totalViews,
      unique_visitors: uniqueVisitors,
      popular_pages: popularPages || [],
      daily_stats: dailyStats || [],
    }

    return jsonResponse(stats)
  } catch (error) {
    console.error('Get analytics stats error:', error)
    return Errors.internalError('Failed to fetch analytics')
  }
}

/**
 * GET /api/analytics/popular
 * Get popular pages (public)
 */
export async function getPopularPages(c: Context<{ Bindings: Env }>): Promise<Response> {
  try {
    const limit = parseInt(c.req.query('limit') || '10', 10)

    const { results } = await c.env.DB.prepare(
      'SELECT path, SUM(views) as views FROM analytics_daily GROUP BY path ORDER BY views DESC LIMIT ?'
    )
      .bind(Math.min(limit, 50))
      .all<{ path: string; views: number }>()

    return jsonResponse({ popular_pages: results || [] })
  } catch (error) {
    console.error('Get popular pages error:', error)
    return Errors.internalError('Failed to fetch popular pages')
  }
}
