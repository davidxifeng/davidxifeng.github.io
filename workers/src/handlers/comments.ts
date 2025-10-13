/**
 * Comments handlers
 */

import type { Context } from 'hono'
import type {
    Env,
    Comment,
    CommentWithUser,
    CreateCommentRequest,
    UpdateCommentRequest,
    PaginatedResponse,
} from '../types'
import { jsonResponse, Errors } from '../utils/response'
import { getCurrentUser } from '../middleware/auth'
import {
    generateId,
    getCurrentTimestamp,
    sanitizeInput,
    parsePagination,
} from '../utils/validation'

/**
 * Build comment tree (nested replies)
 */
function buildCommentTree(comments: CommentWithUser[]): CommentWithUser[] {
    const commentMap = new Map<string, CommentWithUser>()
    const rootComments: CommentWithUser[] = []

    // Initialize all comments with empty replies array
    comments.forEach(comment => {
        commentMap.set(comment.id, { ...comment, replies: [] })
    })

    // Build tree structure
    comments.forEach(comment => {
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
 * GET /api/comments/:postSlug
 * Get comments for a blog post
 */
export async function getComments(
    c: Context<{ Bindings: Env }>
): Promise<Response> {
    try {
        const postSlug = c.req.param('postSlug')
        const user = getCurrentUser(c)
        const { page, limit } = parsePagination(new URL(c.req.url))

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

        // Transform results to include user info and check if liked
        const commentsWithUser: CommentWithUser[] = await Promise.all(
            results.map(async (row: any) => {
                const comment: CommentWithUser = {
                    id: row.id,
                    post_slug: row.post_slug,
                    user_id: row.user_id,
                    parent_id: row.parent_id,
                    content: row.content,
                    status: row.status,
                    likes_count: row.likes_count,
                    created_at: row.created_at,
                    updated_at: row.updated_at,
                    user: {
                        id: row.user_id,
                        email: '', // Don't expose email
                        username: row.user_username,
                        display_name: row.user_display_name,
                        avatar_url: row.user_avatar_url,
                        bio: null,
                        role: 'user',
                        email_verified: true,
                        created_at: 0,
                    },
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

        const response: PaginatedResponse<CommentWithUser> = {
            items: commentTree,
            total,
            page,
            limit,
            has_more: page * limit < total,
        }

        return jsonResponse(response)
    } catch (error) {
        console.error('Get comments error:', error)
        return Errors.internalError('Failed to fetch comments')
    }
}

/**
 * POST /api/comments
 * Create a new comment (requires authentication)
 */
export async function createComment(
    c: Context<{ Bindings: Env }>
): Promise<Response> {
    try {
        const user = getCurrentUser(c)
        if (!user) {
            return Errors.unauthorized()
        }

        const body = await c.req.json<CreateCommentRequest>()
        const { post_slug, content, parent_id } = body

        // Validate input
        if (!post_slug || !content || content.trim().length === 0) {
            return Errors.badRequest('Post slug and content are required')
        }

        if (content.length > 2000) {
            return Errors.badRequest(
                'Comment content must be less than 2000 characters'
            )
        }

        // If parent_id provided, verify it exists
        if (parent_id) {
            const parent = await c.env.DB.prepare(
                'SELECT id FROM comments WHERE id = ? AND post_slug = ?'
            )
                .bind(parent_id, post_slug)
                .first()

            if (!parent) {
                return Errors.badRequest('Parent comment not found')
            }
        }

        // Create comment
        const commentId = generateId()
        const now = getCurrentTimestamp()
        const sanitizedContent = sanitizeInput(content)

        await c.env.DB.prepare(
            'INSERT INTO comments (id, post_slug, user_id, parent_id, content, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
        )
            .bind(
                commentId,
                post_slug,
                user.id,
                parent_id || null,
                sanitizedContent,
                'approved',
                now,
                now
            )
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
            return Errors.internalError('Failed to create comment')
        }

        const commentWithUser: CommentWithUser = {
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
        }

        return jsonResponse(commentWithUser, 201)
    } catch (error) {
        console.error('Create comment error:', error)
        return Errors.internalError('Failed to create comment')
    }
}

/**
 * PUT /api/comments/:id
 * Update a comment (author or admin only)
 */
export async function updateComment(
    c: Context<{ Bindings: Env }>
): Promise<Response> {
    try {
        const user = getCurrentUser(c)
        if (!user) {
            return Errors.unauthorized()
        }

        const commentId = c.req.param('id')
        const body = await c.req.json<UpdateCommentRequest>()
        const { content } = body

        // Validate input
        if (!content || content.trim().length === 0) {
            return Errors.badRequest('Content is required')
        }

        if (content.length > 2000) {
            return Errors.badRequest(
                'Comment content must be less than 2000 characters'
            )
        }

        // Fetch comment
        const comment = await c.env.DB.prepare(
            'SELECT * FROM comments WHERE id = ?'
        )
            .bind(commentId)
            .first<Comment>()

        if (!comment) {
            return Errors.notFound('Comment not found')
        }

        // Check permission (author or admin)
        if (comment.user_id !== user.id && user.role !== 'admin') {
            return Errors.forbidden('You can only edit your own comments')
        }

        // Update comment
        const now = getCurrentTimestamp()
        const sanitizedContent = sanitizeInput(content)

        await c.env.DB.prepare(
            'UPDATE comments SET content = ?, updated_at = ? WHERE id = ?'
        )
            .bind(sanitizedContent, now, commentId)
            .run()

        // Fetch updated comment
        const updatedComment = await c.env.DB.prepare(
            'SELECT * FROM comments WHERE id = ?'
        )
            .bind(commentId)
            .first<Comment>()

        return jsonResponse(updatedComment)
    } catch (error) {
        console.error('Update comment error:', error)
        return Errors.internalError('Failed to update comment')
    }
}

/**
 * DELETE /api/comments/:id
 * Delete a comment (author or admin only)
 */
export async function deleteComment(
    c: Context<{ Bindings: Env }>
): Promise<Response> {
    try {
        const user = getCurrentUser(c)
        if (!user) {
            return Errors.unauthorized()
        }

        const commentId = c.req.param('id')

        // Fetch comment
        const comment = await c.env.DB.prepare(
            'SELECT * FROM comments WHERE id = ?'
        )
            .bind(commentId)
            .first<Comment>()

        if (!comment) {
            return Errors.notFound('Comment not found')
        }

        // Check permission (author or admin)
        if (comment.user_id !== user.id && user.role !== 'admin') {
            return Errors.forbidden('You can only delete your own comments')
        }

        // Delete comment (cascade will handle replies)
        await c.env.DB.prepare('DELETE FROM comments WHERE id = ?')
            .bind(commentId)
            .run()

        return jsonResponse({ message: 'Comment deleted successfully' })
    } catch (error) {
        console.error('Delete comment error:', error)
        return Errors.internalError('Failed to delete comment')
    }
}

/**
 * POST /api/comments/:id/like
 * Toggle like on a comment
 */
export async function toggleCommentLike(
    c: Context<{ Bindings: Env }>
): Promise<Response> {
    try {
        const user = getCurrentUser(c)
        if (!user) {
            return Errors.unauthorized()
        }

        const commentId = c.req.param('id')

        // Check if comment exists
        const comment = await c.env.DB.prepare(
            'SELECT id FROM comments WHERE id = ?'
        )
            .bind(commentId)
            .first()

        if (!comment) {
            return Errors.notFound('Comment not found')
        }

        // Check if already liked
        const existingLike = await c.env.DB.prepare(
            'SELECT id FROM likes WHERE user_id = ? AND target_type = ? AND target_id = ?'
        )
            .bind(user.id, 'comment', commentId)
            .first()

        if (existingLike) {
            // Unlike
            await c.env.DB.prepare('DELETE FROM likes WHERE id = ?')
                .bind(existingLike.id)
                .run()

            await c.env.DB.prepare(
                'UPDATE comments SET likes_count = likes_count - 1 WHERE id = ?'
            )
                .bind(commentId)
                .run()

            return jsonResponse({ liked: false, message: 'Comment unliked' })
        } else {
            // Like
            const likeId = generateId()
            const now = getCurrentTimestamp()

            await c.env.DB.prepare(
                'INSERT INTO likes (id, user_id, target_type, target_id, created_at) VALUES (?, ?, ?, ?, ?)'
            )
                .bind(likeId, user.id, 'comment', commentId, now)
                .run()

            await c.env.DB.prepare(
                'UPDATE comments SET likes_count = likes_count + 1 WHERE id = ?'
            )
                .bind(commentId)
                .run()

            return jsonResponse({ liked: true, message: 'Comment liked' })
        }
    } catch (error) {
        console.error('Toggle comment like error:', error)
        return Errors.internalError('Failed to toggle like')
    }
}
