/**
 * Zod Schemas for API validation and OpenAPI generation
 */

import { z } from 'zod'
import { Str, Num, Bool } from 'chanfana'

// ==================== Base Schemas ====================

// For responses (uses native Zod)
export const UserPublicSchema = z.object({
    id: Str({ example: 'user_123' }),
    email: Str({ example: 'user@example.com' }),
    username: Str({ example: 'johndoe' }),
    display_name: Str({ required: false, example: 'John Doe' }),
    avatar_url: Str({
        required: false,
        example: 'https://example.com/avatar.jpg',
    }),
    bio: Str({ required: false, example: 'Software developer' }),
    role: z.enum(['admin', 'user']),
    email_verified: z.boolean(),
    created_at: Num({ example: 1640995200 }),
})

export const UserSchema = UserPublicSchema.extend({
    password_hash: z.string().nullable(),
    updated_at: z.number(),
})

// ==================== Auth Schemas ====================

export const VerifyCodeRequestSchema = z.object({
    email: z.string().email(),
    type: z.enum(['register', 'reset_password', 'verify_email']),
})

export const RegisterRequestSchema = z.object({
    email: Str({ example: 'user@example.com' }),
    username: Str({ example: 'johndoe' }),
    password: Str({
        example: 'SecurePass123',
        description:
            'At least 8 characters with uppercase, lowercase, and number',
    }),
    verification_code: Str({
        example: '123456',
        description: '6-digit verification code',
    }),
    display_name: Str({ example: 'John Doe' }).optional(),
})

export const LoginRequestSchema = z.object({
    username: Str({ example: 'johndoe', description: 'Email or username' }),
    password: Str({ example: 'SecurePass123' }),
})

// For responses (uses native Zod)
export const AuthResponseSchema = z.object({
    access_token: Str({ example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' }),
    token_type: Str({ example: 'Bearer' }),
    expires_in: Num({ example: 604800 }),
    user: UserPublicSchema,
})

// ==================== Comment Schemas ====================

export const CommentSchema = z.object({
    id: z.string(),
    post_slug: z.string(),
    user_id: z.string(),
    parent_id: z.string().nullable(),
    content: z.string(),
    status: z.enum(['pending', 'approved', 'rejected']),
    likes_count: z.number(),
    created_at: z.number(),
    updated_at: z.number(),
})

// For responses (uses native Zod, with simplified structure for OpenAPI)
export const CommentWithUserSchema = CommentSchema.extend({
    user: UserPublicSchema,
    replies: z.array(z.any()).optional(), // Use z.any() to avoid recursion issues in OpenAPI
    is_liked: z.boolean().optional(),
})

export const CreateCommentRequestSchema = z.object({
    post_slug: Str({ example: 'my-blog-post' }),
    content: Str({
        example: 'Great article!',
        description: 'Comment content (max 2000 characters)',
    }),
    parent_id: Str({ description: 'Parent comment ID for replies' }).optional(),
})

export const UpdateCommentRequestSchema = z.object({
    content: Str({ description: 'Updated comment content' }),
})

// ==================== Feed (Post) Schemas ====================

export const PostSchema = z.object({
    id: z.string(),
    user_id: z.string(),
    content: z.string(),
    images: z.string().nullable(),
    visibility: z.enum(['public', 'private']),
    likes_count: z.number(),
    comments_count: z.number(),
    created_at: z.number(),
    updated_at: z.number(),
})

export const PostWithUserSchema = PostSchema.extend({
    user: UserPublicSchema,
    images_array: z.array(z.string()),
    is_liked: z.boolean().optional(),
})

export const CreatePostRequestSchema = z.object({
    content: Str({
        example: 'Hello world!',
        description: 'Post content (max 2000 characters)',
    }),
    images: z.array(z.string()).optional(),
    visibility: z.enum(['public', 'private']).default('public'),
})

// ==================== Analytics Schemas ====================

export const TrackPageViewRequestSchema = z.object({
    path: Str({ example: '/blog/my-post' }),
    referrer: Str({ example: 'https://google.com' }).optional(),
})

export const AnalyticsStatsSchema = z.object({
    total_views: Num({ example: 1000 }),
    unique_visitors: Num({ example: 500 }),
    popular_pages: z.array(
        z.object({
            path: Str({ example: '/blog/hello-world' }),
            views: Num({ example: 100 }),
        })
    ),
    daily_stats: z.array(
        z.object({
            date: Str({ example: '2023-12-01' }),
            views: Num({ example: 50 }),
            unique_visitors: Num({ example: 25 }),
        })
    ),
})

// ==================== Pagination ====================

export const PaginationParamsSchema = z.object({
    page: z.number().default(1),
    limit: z.number().default(20),
})

export function PaginatedResponseSchema<T extends z.ZodTypeAny>(itemSchema: T) {
    return z.object({
        items: z.array(itemSchema),
        total: z.number(),
        page: z.number(),
        limit: z.number(),
        has_more: z.boolean(),
    })
}

// ==================== Common Response Schemas (for OpenAPI responses) ====================
// These use native Zod types for response validation

export const MessageResponseSchema = z.object({
    message: Str({ example: 'Operation completed successfully' }),
})

export const ErrorResponseSchema = z.object({
    error: Str({ example: 'Bad Request' }),
    message: Str({ example: 'Invalid input' }),
    status: Num({ example: 400 }),
    details: z.any().optional(),
})

export const LikeResponseSchema = z.object({
    liked: z.boolean(),
    message: Str({ example: 'Post liked' }),
})
