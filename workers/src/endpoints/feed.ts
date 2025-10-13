/**
 * Feed (Posts) Endpoints (OpenAPI)
 */

import { OpenAPIRoute, contentJson } from 'chanfana'
import { z } from 'zod'
import type { Context } from 'hono'
import type { Env, User } from '../types'
import {
    PostWithUserSchema,
    CreatePostRequestSchema,
    MessageResponseSchema,
    LikeResponseSchema,
    ErrorResponseSchema,
    PaginatedResponseSchema,
} from '../types/schemas'
import {
    generateId,
    getCurrentTimestamp,
    sanitizeInput,
} from '../utils/validation'
import {
    optionalAuthenticateRequest,
    requireAuthentication,
} from '../utils/auth-helpers'

type AppContext = Context<{ Bindings: Env }>

/**
 * Transform user data to public format
 */
function toUserPublic(user: User, userRow: any) {
    return {
        id: user.id,
        email: '',
        username: userRow.username,
        display_name: userRow.display_name,
        avatar_url: userRow.avatar_url,
        bio: user.bio,
        role: user.role,
        email_verified: true,
        created_at: user.created_at,
    }
}

/**
 * GET /api/feed
 * Get public feed posts
 */
export class FeedList extends OpenAPIRoute {
    schema = {
        tags: ['Feed'],
        summary: 'Get public feed',
        description: 'Get all public posts in chronological order',
        parameters: [
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
                schema: {
                    type: 'integer' as const,
                    default: 20,
                    minimum: 1,
                    maximum: 100,
                },
                description: 'Items per page',
            },
        ],
        responses: {
            '200': {
                description: 'Feed list with posts',
                ...contentJson(
                    z.object({
                        items: z.array(PostWithUserSchema),
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
        const user = await optionalAuthenticateRequest(c)
        const page = parseInt(c.req.query('page') || '1', 10)
        const limit = Math.min(100, parseInt(c.req.query('limit') || '20', 10))

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
        const posts = await Promise.all(
            results.map(async (row: any) => {
                const post: any = {
                    id: row.id,
                    user_id: row.user_id,
                    content: row.content,
                    images: row.images,
                    visibility: row.visibility,
                    likes_count: row.likes_count,
                    comments_count: row.comments_count,
                    created_at: row.created_at,
                    updated_at: row.updated_at,
                    images_array: row.images ? JSON.parse(row.images) : [],
                    user: toUserPublic({} as User, row),
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

        return Response.json({
            items: posts,
            total,
            page,
            limit,
            has_more: page * limit < total,
        })
    }
}

/**
 * POST /api/feed
 * Create a new post (requires authentication)
 */
export class FeedCreate extends OpenAPIRoute {
    schema = {
        tags: ['Feed'],
        summary: 'Create post',
        description: 'Post a new message to the feed',
        security: [{ BearerAuth: [] }],
        request: {
            body: {
                content: {
                    'application/json': {
                        schema: CreatePostRequestSchema,
                    },
                },
            },
        },
        responses: {
            '201': {
                description: 'Post created successfully',
                ...contentJson(PostWithUserSchema),
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
        const { content, images, visibility = 'public' } = data.body

        // Validate input
        if (!content || content.trim().length === 0) {
            return Response.json(
                {
                    error: 'Bad Request',
                    message: 'Content is required',
                    status: 400,
                },
                { status: 400 }
            )
        }

        if (content.length > 2000) {
            return Response.json(
                {
                    error: 'Bad Request',
                    message: 'Content must be less than 2000 characters',
                    status: 400,
                },
                { status: 400 }
            )
        }

        // Create post
        const postId = generateId()
        const now = getCurrentTimestamp()
        const sanitizedContent = sanitizeInput(content)
        const imagesJson =
            images && images.length > 0 ? JSON.stringify(images) : null

        await c.env.DB.prepare(
            'INSERT INTO posts (id, user_id, content, images, visibility, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
        )
            .bind(
                postId,
                user.id,
                sanitizedContent,
                imagesJson,
                visibility,
                now,
                now
            )
            .run()

        // Fetch created post
        const post = await c.env.DB.prepare('SELECT * FROM posts WHERE id = ?')
            .bind(postId)
            .first<any>()

        if (!post) {
            return Response.json(
                {
                    error: 'Internal Server Error',
                    message: 'Failed to create post',
                    status: 500,
                },
                { status: 500 }
            )
        }

        const postWithUser = {
            id: post.id,
            user_id: post.user_id,
            content: post.content,
            images: post.images,
            visibility: post.visibility,
            likes_count: post.likes_count,
            comments_count: post.comments_count,
            created_at: post.created_at,
            updated_at: post.updated_at,
            images_array: images || [],
            user: toUserPublic(user, {
                username: user.username,
                display_name: user.display_name,
                avatar_url: user.avatar_url,
            }),
        }

        return Response.json(postWithUser, { status: 201 })
    }
}

/**
 * DELETE /api/feed/:id
 * Delete a post (author or admin only)
 */
export class FeedDelete extends OpenAPIRoute {
    schema = {
        tags: ['Feed'],
        summary: 'Delete post',
        description: 'Delete your own post (author or admin only)',
        security: [{ BearerAuth: [] }],
        parameters: [
            {
                name: 'id',
                in: 'path' as const,
                required: true,
                schema: { type: 'string' as const },
                description: 'Post ID',
            },
        ],
        responses: {
            '200': {
                description: 'Post deleted successfully',
                ...contentJson(MessageResponseSchema),
            },
            '403': {
                description: 'Forbidden',
                ...contentJson(ErrorResponseSchema),
            },
            '404': {
                description: 'Post not found',
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
        const postId = c.req.param('id')

        // Fetch post
        const post = await c.env.DB.prepare('SELECT * FROM posts WHERE id = ?')
            .bind(postId)
            .first<any>()

        if (!post) {
            return Response.json(
                { error: 'Not Found', message: 'Post not found', status: 404 },
                { status: 404 }
            )
        }

        // Check permission
        if (post.user_id !== user.id && user.role !== 'admin') {
            return Response.json(
                {
                    error: 'Forbidden',
                    message: 'You can only delete your own posts',
                    status: 403,
                },
                { status: 403 }
            )
        }

        // Delete post
        await c.env.DB.prepare('DELETE FROM posts WHERE id = ?')
            .bind(postId)
            .run()

        return Response.json({ message: 'Post deleted successfully' })
    }
}

/**
 * POST /api/feed/:id/like
 * Toggle like on a post
 */
export class FeedLike extends OpenAPIRoute {
    schema = {
        tags: ['Feed'],
        summary: 'Like/unlike post',
        description: 'Toggle like status on a post',
        security: [{ BearerAuth: [] }],
        parameters: [
            {
                name: 'id',
                in: 'path' as const,
                required: true,
                schema: { type: 'string' as const },
                description: 'Post ID',
            },
        ],
        responses: {
            '200': {
                description: 'Like status toggled',
                ...contentJson(LikeResponseSchema),
            },
            '404': {
                description: 'Post not found',
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
        const postId = c.req.param('id')

        // Check if post exists
        const post = await c.env.DB.prepare('SELECT id FROM posts WHERE id = ?')
            .bind(postId)
            .first()

        if (!post) {
            return Response.json(
                { error: 'Not Found', message: 'Post not found', status: 404 },
                { status: 404 }
            )
        }

        // Check if already liked
        const existingLike = await c.env.DB.prepare(
            'SELECT id FROM likes WHERE user_id = ? AND target_type = ? AND target_id = ?'
        )
            .bind(user.id, 'post', postId)
            .first()

        if (existingLike) {
            // Unlike
            await c.env.DB.prepare('DELETE FROM likes WHERE id = ?')
                .bind(existingLike.id)
                .run()
            await c.env.DB.prepare(
                'UPDATE posts SET likes_count = likes_count - 1 WHERE id = ?'
            )
                .bind(postId)
                .run()

            return Response.json({ liked: false, message: 'Post unliked' })
        } else {
            // Like
            const likeId = generateId()
            const now = getCurrentTimestamp()

            await c.env.DB.prepare(
                'INSERT INTO likes (id, user_id, target_type, target_id, created_at) VALUES (?, ?, ?, ?, ?)'
            )
                .bind(likeId, user.id, 'post', postId, now)
                .run()

            await c.env.DB.prepare(
                'UPDATE posts SET likes_count = likes_count + 1 WHERE id = ?'
            )
                .bind(postId)
                .run()

            return Response.json({ liked: true, message: 'Post liked' })
        }
    }
}
