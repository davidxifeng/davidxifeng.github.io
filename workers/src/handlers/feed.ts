/**
 * Feed (Posts) handlers - Twitter-like timeline
 */

import type { Context } from 'hono'
import type {
  Env,
  Post,
  PostWithUser,
  CreatePostRequest,
  UpdatePostRequest,
  PaginatedResponse,
} from '../types'
import { jsonResponse, Errors } from '../utils/response'
import { getCurrentUser } from '../middleware/auth'
import { generateId, getCurrentTimestamp, sanitizeInput, parsePagination } from '../utils/validation'

/**
 * GET /api/feed
 * Get public feed posts
 */
export async function getFeed(c: Context<{ Bindings: Env }>): Promise<Response> {
  try {
    const user = getCurrentUser(c)
    const { page, limit } = parsePagination(new URL(c.req.url))

    // Get total count
    const countResult = await c.env.DB.prepare(
      'SELECT COUNT(*) as total FROM posts WHERE visibility = ?'
    )
      .bind('public')
      .first<{ total: number }>()

    const total = countResult?.total || 0

    // Get posts with user info
    const { results } = await c.env.DB.prepare(
      `SELECT
        p.*,
        u.username, u.display_name, u.avatar_url
      FROM posts p
      JOIN users u ON p.user_id = u.id
      WHERE p.visibility = ?
      ORDER BY p.created_at DESC
      LIMIT ? OFFSET ?`
    )
      .bind('public', limit, (page - 1) * limit)
      .all<any>()

    // Transform results
    const posts: PostWithUser[] = await Promise.all(
      results.map(async (row: any) => {
        const post: PostWithUser = {
          ...row,
          images_array: row.images ? JSON.parse(row.images) : [],
          user: {
            id: row.user_id,
            email: '',
            username: row.username,
            display_name: row.display_name,
            avatar_url: row.avatar_url,
            bio: null,
            role: 'user',
            email_verified: true,
            created_at: 0,
          },
        }

        // Check if current user liked this post
        if (user) {
          const likeResult = await c.env.DB.prepare(
            'SELECT id FROM likes WHERE user_id = ? AND target_type = ? AND target_id = ?'
          )
            .bind(user.id, 'post', row.id)
            .first()

          post.is_liked = !!likeResult
        }

        return post
      })
    )

    const response: PaginatedResponse<PostWithUser> = {
      items: posts,
      total,
      page,
      limit,
      has_more: page * limit < total,
    }

    return jsonResponse(response)
  } catch (error) {
    console.error('Get feed error:', error)
    return Errors.internalError('Failed to fetch feed')
  }
}

/**
 * POST /api/feed
 * Create a new post (requires authentication)
 */
export async function createPost(c: Context<{ Bindings: Env }>): Promise<Response> {
  try {
    const user = getCurrentUser(c)
    if (!user) {
      return Errors.unauthorized()
    }

    const body = await c.req.json<CreatePostRequest>()
    const { content, images, visibility = 'public' } = body

    // Validate input
    if (!content || content.trim().length === 0) {
      return Errors.badRequest('Content is required')
    }

    if (content.length > 2000) {
      return Errors.badRequest('Content must be less than 2000 characters')
    }

    // Create post
    const postId = generateId()
    const now = getCurrentTimestamp()
    const sanitizedContent = sanitizeInput(content)
    const imagesJson = images && images.length > 0 ? JSON.stringify(images) : null

    await c.env.DB.prepare(
      'INSERT INTO posts (id, user_id, content, images, visibility, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
    )
      .bind(postId, user.id, sanitizedContent, imagesJson, visibility, now, now)
      .run()

    // Fetch created post
    const post = await c.env.DB.prepare('SELECT * FROM posts WHERE id = ?')
      .bind(postId)
      .first<Post>()

    if (!post) {
      return Errors.internalError('Failed to create post')
    }

    const postWithUser: PostWithUser = {
      ...post,
      images_array: images || [],
      user: {
        id: user.id,
        email: '',
        username: user.username,
        display_name: user.display_name,
        avatar_url: user.avatar_url,
        bio: user.bio,
        role: user.role,
        email_verified: true,
        created_at: user.created_at,
      },
    }

    return jsonResponse(postWithUser, 201)
  } catch (error) {
    console.error('Create post error:', error)
    return Errors.internalError('Failed to create post')
  }
}

/**
 * DELETE /api/feed/:id
 * Delete a post (author or admin only)
 */
export async function deletePost(c: Context<{ Bindings: Env }>): Promise<Response> {
  try {
    const user = getCurrentUser(c)
    if (!user) {
      return Errors.unauthorized()
    }

    const postId = c.req.param('id')

    // Fetch post
    const post = await c.env.DB.prepare('SELECT * FROM posts WHERE id = ?')
      .bind(postId)
      .first<Post>()

    if (!post) {
      return Errors.notFound('Post not found')
    }

    // Check permission
    if (post.user_id !== user.id && user.role !== 'admin') {
      return Errors.forbidden('You can only delete your own posts')
    }

    // Delete post
    await c.env.DB.prepare('DELETE FROM posts WHERE id = ?').bind(postId).run()

    return jsonResponse({ message: 'Post deleted successfully' })
  } catch (error) {
    console.error('Delete post error:', error)
    return Errors.internalError('Failed to delete post')
  }
}

/**
 * POST /api/feed/:id/like
 * Toggle like on a post
 */
export async function togglePostLike(c: Context<{ Bindings: Env }>): Promise<Response> {
  try {
    const user = getCurrentUser(c)
    if (!user) {
      return Errors.unauthorized()
    }

    const postId = c.req.param('id')

    // Check if post exists
    const post = await c.env.DB.prepare('SELECT id FROM posts WHERE id = ?')
      .bind(postId)
      .first()

    if (!post) {
      return Errors.notFound('Post not found')
    }

    // Check if already liked
    const existingLike = await c.env.DB.prepare(
      'SELECT id FROM likes WHERE user_id = ? AND target_type = ? AND target_id = ?'
    )
      .bind(user.id, 'post', postId)
      .first()

    if (existingLike) {
      // Unlike
      await c.env.DB.prepare('DELETE FROM likes WHERE id = ?').bind(existingLike.id).run()
      await c.env.DB.prepare('UPDATE posts SET likes_count = likes_count - 1 WHERE id = ?')
        .bind(postId)
        .run()

      return jsonResponse({ liked: false, message: 'Post unliked' })
    } else {
      // Like
      const likeId = generateId()
      const now = getCurrentTimestamp()

      await c.env.DB.prepare(
        'INSERT INTO likes (id, user_id, target_type, target_id, created_at) VALUES (?, ?, ?, ?, ?)'
      )
        .bind(likeId, user.id, 'post', postId, now)
        .run()

      await c.env.DB.prepare('UPDATE posts SET likes_count = likes_count + 1 WHERE id = ?')
        .bind(postId)
        .run()

      return jsonResponse({ liked: true, message: 'Post liked' })
    }
  } catch (error) {
    console.error('Toggle post like error:', error)
    return Errors.internalError('Failed to toggle like')
  }
}
