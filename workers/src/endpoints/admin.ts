/**
 * Admin Endpoints (OpenAPI)
 */

import { OpenAPIRoute, contentJson } from 'chanfana'
import { z } from 'zod'
import type { Context } from 'hono'
import type { Env } from '../types'
import { MessageResponseSchema, ErrorResponseSchema } from '../types/schemas'
import { requireAdmin } from '../utils/auth-helpers'

type AppContext = Context<{ Bindings: Env }>

/**
 * GET /api/admin/comments
 * Get pending comments for moderation
 */
export class AdminComments extends OpenAPIRoute {
  schema = {
    tags: ['Admin'],
    summary: 'Get pending comments',
    description: 'Get all pending comments that need moderation (admin only)',
    security: [{ BearerAuth: [] }],
    responses: {
      '200': {
        description: 'List of pending comments',
        ...contentJson(
          z.object({
            comments: z.array(
              z.object({
                id: z.string(),
                post_slug: z.string(),
                user_id: z.string(),
                parent_id: z.string().nullable(),
                content: z.string(),
                status: z.string(),
                likes_count: z.number(),
                created_at: z.number(),
                updated_at: z.number(),
                username: z.string(),
              })
            ),
          })
        ),
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

    const { results } = await c.env.DB.prepare(
      'SELECT c.*, u.username FROM comments c JOIN users u ON c.user_id = u.id WHERE c.status = ? ORDER BY c.created_at DESC'
    )
      .bind('pending')
      .all()

    return Response.json({ comments: results || [] })
  }
}

/**
 * PUT /api/admin/comments/:id/status
 * Update comment status (approve/reject)
 */
export class AdminCommentStatus extends OpenAPIRoute {
  schema = {
    tags: ['Admin'],
    summary: 'Update comment status',
    description: 'Approve or reject a comment (admin only)',
    security: [{ BearerAuth: [] }],
    parameters: [
      {
        name: 'id',
        in: 'path',
        required: true,
        schema: { type: 'string' },
        description: 'Comment ID',
      },
    ],
    request: {
      body: {
        content: {
          'application/json': {
            schema: z.object({
              status: z.enum(['approved', 'rejected']).describe('New comment status'),
            }),
          },
        },
      },
    },
    responses: {
      '200': {
        description: 'Comment status updated successfully',
        ...contentJson(MessageResponseSchema),
      },
      '400': {
        description: 'Invalid status value',
        ...contentJson(ErrorResponseSchema),
      },
      '403': {
        description: 'Forbidden - Admin access required',
        ...contentJson(ErrorResponseSchema),
      },
      '404': {
        description: 'Comment not found',
        ...contentJson(ErrorResponseSchema),
      },
    },
  }

  async handle(c: AppContext) {
    const result = await requireAdmin(c)

    if ('error' in result) {
      return result.error
    }

    const commentId = c.req.param('id')
    const data = await this.getValidatedData<typeof this.schema>()
    const { status } = data.body

    // Verify comment exists
    const comment = await c.env.DB.prepare('SELECT id FROM comments WHERE id = ?')
      .bind(commentId)
      .first()

    if (!comment) {
      return Response.json(
        { error: 'Not Found', message: 'Comment not found', status: 404 },
        { status: 404 }
      )
    }

    // Update comment status
    await c.env.DB.prepare('UPDATE comments SET status = ? WHERE id = ?')
      .bind(status, commentId)
      .run()

    return Response.json({ message: 'Comment status updated successfully' })
  }
}