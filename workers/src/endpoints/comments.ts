/**
 * Comments Endpoints (OpenAPI)
 */

import { OpenAPIRoute, contentJson } from 'chanfana'
import { z } from 'zod'
import type { Context } from 'hono'
import type { Env, Comment, User } from '../types'
import {
  CommentWithUserSchema,
  CreateCommentRequestSchema,
  UpdateCommentRequestSchema,
  MessageResponseSchema,
  LikeResponseSchema,
  ErrorResponseSchema,
  PaginatedResponseSchema,
} from '../types/schemas'
import { generateId, getCurrentTimestamp, sanitizeInput } from '../utils/validation'
import { optionalAuthenticateRequest, requireAuthentication } from '../utils/auth-helpers'

type AppContext = Context<{ Bindings: Env }>

/**
 * Build comment tree (nested replies)
 */
function buildCommentTree(comments: any[]): any[] {
  const commentMap = new Map<string, any>()
  const rootComments: any[] = []

  comments.forEach((comment) => {
    commentMap.set(comment.id, { ...comment, replies: [] })
  })

  comments.forEach((comment) => {
    const commentWithReplies = commentMap.get(comment.id)!
    if (comment.parent_id) {
      const parent = commentMap.get(comment.parent_id)
      if (parent) {
        parent.replies = parent.replies || []
        parent.replies.push(commentWithReplies)
      }
    } else {
      rootComments.push(commentWithReplies)
    }
  })

  return rootComments
}

/**
 * Transform user data to public format
 */
function toUserPublic(row: any) {
  return {
    id: row.user_id,
    email: '',
    username: row.user_username,
    display_name: row.user_display_name,
    avatar_url: row.user_avatar_url,
    bio: null,
    role: 'user' as const,
    email_verified: true,
    created_at: 0,
  }
}

/**
 * GET /api/comments/:postSlug
 * Get comments for a blog post
 */
export class CommentsList extends OpenAPIRoute {
  schema = {
    tags: ['Comments'],
    summary: 'List comments',
    description: 'Get all approved comments for a blog post with nested replies',
    parameters: [
      {
        name: 'postSlug',
        in: 'path' as const,
        required: true,
        schema: { type: 'string' as const },
        description: 'Blog post slug',
        example: 'my-blog-post',
      },
      {
        name: 'page',
        in: 'query' as const,
        required: false,
        schema: { type: 'integer' as const, default: 1, minimum: 1 },
        description: 'Page number',
      },
      {
        name: 'limit',
        in: 'query' as const,
        required: false,
        schema: { type: 'integer' as const, default: 20, minimum: 1, maximum: 100 },
        description: 'Items per page',
      },
    ],
    responses: {
      '200': {
        description: 'Comments list with nested replies',
        ...contentJson(
          z.object({
            items: z.array(CommentWithUserSchema),
            total: z.number(),
            page: z.number(),
            limit: z.number(),
            has_more: z.boolean(),
          })
        ),
      },
    },
  }

  async handle(c: AppContext) {
    const postSlug = c.req.param('postSlug')
    const user = await optionalAuthenticateRequest(c)
    const page = parseInt(c.req.query('page') || '1', 10)
    const limit = Math.min(100, parseInt(c.req.query('limit') || '20', 10))

    // Get total count
    const countResult = await c.env.DB.prepare(
      'SELECT COUNT(*) as total FROM comments WHERE post_slug = ? AND status = ?'
    )
      .bind(postSlug, 'approved')
      .first<{ total: number }>()

    const total = countResult?.total || 0

    // Get comments with user info
    const { results } = await c.env.DB.prepare(
      `SELECT
        c.*,
        u.id as user_id,
        u.username as user_username,
        u.display_name as user_display_name,
        u.avatar_url as user_avatar_url
      FROM comments c
      JOIN users u ON c.user_id = u.id
      WHERE c.post_slug = ? AND c.status = ?
      ORDER BY c.created_at DESC
      LIMIT ? OFFSET ?`
    )
      .bind(postSlug, 'approved', limit, (page - 1) * limit)
      .all<any>()

    // Transform results
    const commentsWithUser = await Promise.all(
      results.map(async (row: any) => {
        const comment: any = {
          id: row.id,
          post_slug: row.post_slug,
          user_id: row.user_id,
          parent_id: row.parent_id,
          content: row.content,
          status: row.status,
          likes_count: row.likes_count,
          created_at: row.created_at,
          updated_at: row.updated_at,
          user: toUserPublic(row),
        }

        // Check if current user liked this comment
        if (user) {
          const likeResult = await c.env.DB.prepare(
            'SELECT id FROM likes WHERE user_id = ? AND target_type = ? AND target_id = ?'
          )
            .bind(user.id, 'comment', row.id)
            .first()

          comment.is_liked = !!likeResult
        }

        return comment
      })
    )

    // Build comment tree
    const commentTree = buildCommentTree(commentsWithUser)

    return Response.json({
      items: commentTree,
      total,
      page,
      limit,
      has_more: page * limit < total,
    })
  }
}

/**
 * POST /api/comments
 * Create a new comment
 */
export class CommentsCreate extends OpenAPIRoute {
  schema = {
    tags: ['Comments'],
    summary: 'Create comment',
    description: 'Post a new comment or reply to an existing comment',
    security: [{ BearerAuth: [] }],
    request: {
      body: {
        content: {
          'application/json': {
            schema: CreateCommentRequestSchema,
          },
        },
      },
    },
    responses: {
      '201': {
        description: 'Comment created successfully',
        ...contentJson(CommentWithUserSchema),
      },
      '400': {
        description: 'Invalid request',
        ...contentJson(ErrorResponseSchema),
      },
      '401': {
        description: 'Unauthorized',
        ...contentJson(ErrorResponseSchema),
      },
    },
  }

  async handle(c: AppContext) {
    const result = await requireAuthentication(c)

    if ('error' in result) {
      return result.error
    }

    const user = result.user
    const data = await this.getValidatedData<typeof this.schema>()
    const { post_slug, content, parent_id } = data.body

    // Validate input
    if (!post_slug || !content || content.trim().length === 0) {
      return Response.json(
        { error: 'Bad Request', message: 'Post slug and content are required', status: 400 },
        { status: 400 }
      )
    }

    if (content.length > 2000) {
      return Response.json(
        { error: 'Bad Request', message: 'Comment content must be less than 2000 characters', status: 400 },
        { status: 400 }
      )
    }

    // If parent_id provided, verify it exists
    if (parent_id) {
      const parent = await c.env.DB.prepare('SELECT id FROM comments WHERE id = ? AND post_slug = ?')
        .bind(parent_id, post_slug)
        .first()

      if (!parent) {
        return Response.json(
          { error: 'Bad Request', message: 'Parent comment not found', status: 400 },
          { status: 400 }
        )
      }
    }

    // Create comment
    const commentId = generateId()
    const now = getCurrentTimestamp()
    const sanitizedContent = sanitizeInput(content)

    await c.env.DB.prepare(
      'INSERT INTO comments (id, post_slug, user_id, parent_id, content, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
    )
      .bind(commentId, post_slug, user.id, parent_id || null, sanitizedContent, 'approved', now, now)
      .run()

    // Fetch created comment with user info
    const comment = await c.env.DB.prepare(
      `SELECT
        c.*,
        u.username as user_username,
        u.display_name as user_display_name,
        u.avatar_url as user_avatar_url
      FROM comments c
      JOIN users u ON c.user_id = u.id
      WHERE c.id = ?`
    )
      .bind(commentId)
      .first<any>()

    if (!comment) {
      return Response.json(
        { error: 'Internal Server Error', message: 'Failed to create comment', status: 500 },
        { status: 500 }
      )
    }

    return Response.json(
      {
        ...comment,
        user: {
          id: user.id,
          email: '',
          username: comment.user_username,
          display_name: comment.user_display_name,
          avatar_url: comment.user_avatar_url,
          bio: null,
          role: user.role,
          email_verified: true,
          created_at: user.created_at,
        },
      },
      { status: 201 }
    )
  }
}

/**
 * PUT /api/comments/:id
 * Update a comment
 */
export class CommentsUpdate extends OpenAPIRoute {
  schema = {
    tags: ['Comments'],
    summary: 'Update comment',
    description: 'Edit your own comment (author or admin only)',
    security: [{ BearerAuth: [] }],
    parameters: [
      {
        name: 'id',
        in: 'path' as const,
        required: true,
        schema: { type: 'string' as const },
        description: 'Comment ID',
      },
    ],
    request: {
      body: {
        content: {
          'application/json': {
            schema: UpdateCommentRequestSchema,
          },
        },
      },
    },
    responses: {
      '200': {
        description: 'Comment updated successfully',
        ...contentJson(CommentWithUserSchema),
      },
      '400': {
        description: 'Invalid request',
        ...contentJson(ErrorResponseSchema),
      },
      '403': {
        description: 'Forbidden - not comment author',
        ...contentJson(ErrorResponseSchema),
      },
      '404': {
        description: 'Comment not found',
        ...contentJson(ErrorResponseSchema),
      },
    },
  }

  async handle(c: AppContext) {
    const result = await requireAuthentication(c)

    if ('error' in result) {
      return result.error
    }

    const user = result.user
    const commentId = c.req.param('id')
    const data = await this.getValidatedData<typeof this.schema>()
    const { content } = data.body

    if (!content || content.trim().length === 0) {
      return Response.json(
        { error: 'Bad Request', message: 'Content is required', status: 400 },
        { status: 400 }
      )
    }

    if (content.length > 2000) {
      return Response.json(
        { error: 'Bad Request', message: 'Comment content must be less than 2000 characters', status: 400 },
        { status: 400 }
      )
    }

    // Fetch comment
    const comment = await c.env.DB.prepare('SELECT * FROM comments WHERE id = ?')
      .bind(commentId)
      .first<Comment>()

    if (!comment) {
      return Response.json(
        { error: 'Not Found', message: 'Comment not found', status: 404 },
        { status: 404 }
      )
    }

    // Check permission
    if (comment.user_id !== user.id && user.role !== 'admin') {
      return Response.json(
        { error: 'Forbidden', message: 'You can only edit your own comments', status: 403 },
        { status: 403 }
      )
    }

    // Update comment
    const now = getCurrentTimestamp()
    const sanitizedContent = sanitizeInput(content)

    await c.env.DB.prepare('UPDATE comments SET content = ?, updated_at = ? WHERE id = ?')
      .bind(sanitizedContent, now, commentId)
      .run()

    // Fetch updated comment
    const updatedComment = await c.env.DB.prepare('SELECT * FROM comments WHERE id = ?')
      .bind(commentId)
      .first<Comment>()

    return Response.json(updatedComment)
  }
}

/**
 * DELETE /api/comments/:id
 * Delete a comment
 */
export class CommentsDelete extends OpenAPIRoute {
  schema = {
    tags: ['Comments'],
    summary: 'Delete comment',
    description: 'Delete your own comment (author or admin only)',
    security: [{ BearerAuth: [] }],
    parameters: [
      {
        name: 'id',
        in: 'path' as const,
        required: true,
        schema: { type: 'string' as const },
        description: 'Comment ID',
      },
    ],
    responses: {
      '200': {
        description: 'Comment deleted successfully',
        ...contentJson(MessageResponseSchema),
      },
      '403': {
        description: 'Forbidden',
        ...contentJson(ErrorResponseSchema),
      },
      '404': {
        description: 'Comment not found',
        ...contentJson(ErrorResponseSchema),
      },
    },
  }

  async handle(c: AppContext) {
    const result = await requireAuthentication(c)

    if ('error' in result) {
      return result.error
    }

    const user = result.user
    const commentId = c.req.param('id')

    // Fetch comment
    const comment = await c.env.DB.prepare('SELECT * FROM comments WHERE id = ?')
      .bind(commentId)
      .first<Comment>()

    if (!comment) {
      return Response.json(
        { error: 'Not Found', message: 'Comment not found', status: 404 },
        { status: 404 }
      )
    }

    // Check permission
    if (comment.user_id !== user.id && user.role !== 'admin') {
      return Response.json(
        { error: 'Forbidden', message: 'You can only delete your own comments', status: 403 },
        { status: 403 }
      )
    }

    // Delete comment
    await c.env.DB.prepare('DELETE FROM comments WHERE id = ?').bind(commentId).run()

    return Response.json({ message: 'Comment deleted successfully' })
  }
}

/**
 * POST /api/comments/:id/like
 * Toggle like on a comment
 */
export class CommentsLike extends OpenAPIRoute {
  schema = {
    tags: ['Comments'],
    summary: 'Like/unlike comment',
    description: 'Toggle like status on a comment',
    security: [{ BearerAuth: [] }],
    parameters: [
      {
        name: 'id',
        in: 'path' as const,
        required: true,
        schema: { type: 'string' as const },
        description: 'Comment ID',
      },
    ],
    responses: {
      '200': {
        description: 'Like status toggled',
        ...contentJson(LikeResponseSchema),
      },
      '404': {
        description: 'Comment not found',
        ...contentJson(ErrorResponseSchema),
      },
    },
  }

  async handle(c: AppContext) {
    const result = await requireAuthentication(c)

    if ('error' in result) {
      return result.error
    }

    const user = result.user
    const commentId = c.req.param('id')

    // Check if comment exists
    const comment = await c.env.DB.prepare('SELECT id FROM comments WHERE id = ?')
      .bind(commentId)
      .first()

    if (!comment) {
      return Response.json(
        { error: 'Not Found', message: 'Comment not found', status: 404 },
        { status: 404 }
      )
    }

    // Check if already liked
    const existingLike = await c.env.DB.prepare(
      'SELECT id FROM likes WHERE user_id = ? AND target_type = ? AND target_id = ?'
    )
      .bind(user.id, 'comment', commentId)
      .first()

    if (existingLike) {
      // Unlike
      await c.env.DB.prepare('DELETE FROM likes WHERE id = ?').bind(existingLike.id).run()
      await c.env.DB.prepare('UPDATE comments SET likes_count = likes_count - 1 WHERE id = ?')
        .bind(commentId)
        .run()

      return Response.json({ liked: false, message: 'Comment unliked' })
    } else {
      // Like
      const likeId = generateId()
      const now = getCurrentTimestamp()

      await c.env.DB.prepare(
        'INSERT INTO likes (id, user_id, target_type, target_id, created_at) VALUES (?, ?, ?, ?, ?)'
      )
        .bind(likeId, user.id, 'comment', commentId, now)
        .run()

      await c.env.DB.prepare('UPDATE comments SET likes_count = likes_count + 1 WHERE id = ?')
        .bind(commentId)
        .run()

      return Response.json({ liked: true, message: 'Comment liked' })
    }
  }
}
