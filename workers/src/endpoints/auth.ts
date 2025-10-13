/**
 * Authentication Endpoints (OpenAPI)
 */

import { OpenAPIRoute, Str, contentJson } from 'chanfana'
import { z } from 'zod'
import type { Context } from 'hono'
import type { Env, User } from '../types'
import {
    VerifyCodeRequestSchema,
    RegisterRequestSchema,
    LoginRequestSchema,
    AuthResponseSchema,
    UserPublicSchema,
    MessageResponseSchema,
    ErrorResponseSchema,
} from '../types/schemas'
import {
    hashPassword,
    verifyPassword,
    validatePasswordStrength,
} from '../utils/password'
import { generateToken } from '../utils/jwt'
import {
    isValidEmail,
    isValidUsername,
    isValidVerificationCode,
    generateVerificationCode,
    generateId,
    getCurrentTimestamp,
    sanitizeInput,
} from '../utils/validation'
import { requireAuthentication } from '../utils/auth-helpers'

type AppContext = Context<{ Bindings: Env }>

/**
 * Convert User to UserPublic
 */
function toUserPublic(user: User) {
    return {
        id: user.id,
        email: user.email,
        username: user.username,
        display_name: user.display_name,
        avatar_url: user.avatar_url,
        bio: user.bio,
        role: user.role,
        email_verified: user.email_verified === 1,
        created_at: user.created_at,
    }
}

/**
 * POST /api/auth/verify-code
 * Request a verification code
 */
export class AuthVerifyCode extends OpenAPIRoute {
    schema = {
        tags: ['Authentication'],
        summary: 'Request verification code',
        description: 'Send a verification code to the specified email address',
        request: {
            body: {
                content: {
                    'application/json': {
                        schema: VerifyCodeRequestSchema,
                    },
                },
            },
        },
        responses: {
            '200': {
                description: 'Verification code sent successfully',
                ...contentJson(
                    z.object({
                        message: z.string(),
                        dev_code: z.string().optional(),
                    })
                ),
            },
            '400': {
                description: 'Invalid request',
                ...contentJson(ErrorResponseSchema),
            },
            '409': {
                description: 'Email already registered',
                ...contentJson(ErrorResponseSchema),
            },
        },
    }

    async handle(c: AppContext) {
        const data = await this.getValidatedData<typeof this.schema>()
        const { email, type } = data.body

        // Validate email
        if (!isValidEmail(email)) {
            return Response.json(
                {
                    error: 'Bad Request',
                    message: 'Invalid email format',
                    status: 400,
                },
                { status: 400 }
            )
        }

        // Check if email already exists (for registration)
        if (type === 'register') {
            const existingUser = await c.env.DB.prepare(
                'SELECT id FROM users WHERE email = ?'
            )
                .bind(email)
                .first()

            if (existingUser) {
                return Response.json(
                    {
                        error: 'Conflict',
                        message: 'Email already registered',
                        status: 409,
                    },
                    { status: 409 }
                )
            }
        }

        // Generate verification code
        const code = generateVerificationCode()
        const id = generateId()
        const now = getCurrentTimestamp()
        const expiresAt = now + 10 * 60 // 10 minutes

        // Store verification code
        await c.env.DB.prepare(
            'INSERT INTO verification_codes (id, email, code, type, expires_at, created_at) VALUES (?, ?, ?, ?, ?, ?)'
        )
            .bind(id, email, code, type, expiresAt, now)
            .run()

        // TODO: Send email with verification code
        console.log(`Verification code for ${email}: ${code}`)

        return Response.json({
            message: 'Verification code sent to your email',
            dev_code: c.env.ENVIRONMENT === 'development' ? code : undefined,
        })
    }
}

/**
 * POST /api/auth/register
 * Register a new user
 */
export class AuthRegister extends OpenAPIRoute {
    schema = {
        tags: ['Authentication'],
        summary: 'Register new user',
        description: 'Create a new user account with email verification',
        request: {
            body: {
                content: {
                    'application/json': {
                        schema: RegisterRequestSchema,
                    },
                },
            },
        },
        responses: {
            '201': {
                description: 'User registered successfully',
                ...contentJson(AuthResponseSchema),
            },
            '400': {
                description: 'Invalid request or weak password',
                ...contentJson(ErrorResponseSchema),
            },
            '409': {
                description: 'Email or username already registered',
                ...contentJson(ErrorResponseSchema),
            },
        },
    }

    async handle(c: AppContext) {
        const data = await this.getValidatedData<typeof this.schema>()
        const { email, username, password, verification_code, display_name } =
            data.body

        // Validate input
        if (!isValidEmail(email)) {
            return Response.json(
                {
                    error: 'Bad Request',
                    message: 'Invalid email format',
                    status: 400,
                },
                { status: 400 }
            )
        }

        if (!isValidUsername(username)) {
            return Response.json(
                {
                    error: 'Bad Request',
                    message:
                        'Invalid username. Must be 3-20 characters, start with a letter, and contain only letters, numbers, underscores, and hyphens',
                    status: 400,
                },
                { status: 400 }
            )
        }

        const passwordValidation = validatePasswordStrength(password)
        if (!passwordValidation.valid) {
            return Response.json(
                {
                    error: 'Bad Request',
                    message: 'Weak password',
                    status: 400,
                    details: passwordValidation.errors,
                },
                { status: 400 }
            )
        }

        if (!isValidVerificationCode(verification_code)) {
            return Response.json(
                {
                    error: 'Bad Request',
                    message: 'Invalid verification code format',
                    status: 400,
                },
                { status: 400 }
            )
        }

        // Verify verification code
        const verificationRecord = await c.env.DB.prepare(
            'SELECT * FROM verification_codes WHERE email = ? AND code = ? AND type = ? AND used = 0 AND expires_at > ?'
        )
            .bind(email, verification_code, 'register', getCurrentTimestamp())
            .first()

        if (!verificationRecord) {
            return Response.json(
                {
                    error: 'Bad Request',
                    message: 'Invalid or expired verification code',
                    status: 400,
                },
                { status: 400 }
            )
        }

        // Check if email or username already exists
        const existingUser = await c.env.DB.prepare(
            'SELECT id FROM users WHERE email = ? OR username = ?'
        )
            .bind(email, username)
            .first()

        if (existingUser) {
            return Response.json(
                {
                    error: 'Conflict',
                    message: 'Email or username already registered',
                    status: 409,
                },
                { status: 409 }
            )
        }

        // Hash password
        const passwordHash = await hashPassword(password)

        // Create user
        const userId = generateId()
        const now = getCurrentTimestamp()
        const sanitizedDisplayName = display_name
            ? sanitizeInput(display_name)
            : username

        await c.env.DB.prepare(
            'INSERT INTO users (id, email, username, password_hash, display_name, role, email_verified, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
        )
            .bind(
                userId,
                email,
                username,
                passwordHash,
                sanitizedDisplayName,
                'user',
                1,
                now,
                now
            )
            .run()

        // Mark verification code as used
        await c.env.DB.prepare(
            'UPDATE verification_codes SET used = 1 WHERE id = ?'
        )
            .bind(verificationRecord.id)
            .run()

        // Fetch created user
        const user = await c.env.DB.prepare('SELECT * FROM users WHERE id = ?')
            .bind(userId)
            .first<User>()

        if (!user) {
            return Response.json(
                {
                    error: 'Internal Server Error',
                    message: 'Failed to create user',
                    status: 500,
                },
                { status: 500 }
            )
        }

        // Generate JWT token
        const token = await generateToken(user, c.env.JWT_SECRET)

        return Response.json(
            {
                access_token: token,
                token_type: 'Bearer',
                expires_in: 7 * 24 * 60 * 60,
                user: toUserPublic(user),
            },
            { status: 201 }
        )
    }
}

/**
 * POST /api/auth/login
 * Login with username/email and password
 */
export class AuthLogin extends OpenAPIRoute {
    schema = {
        tags: ['Authentication'],
        summary: 'User login',
        description: 'Authenticate a user with username/email and password',
        request: {
            body: {
                content: {
                    'application/json': {
                        schema: LoginRequestSchema,
                    },
                },
            },
        },
        responses: {
            '200': {
                description: 'Login successful',
                ...contentJson(AuthResponseSchema),
            },
            '401': {
                description: 'Invalid credentials',
                ...contentJson(ErrorResponseSchema),
            },
            '403': {
                description: 'Email not verified',
                ...contentJson(ErrorResponseSchema),
            },
        },
    }

    async handle(c: AppContext) {
        const data = await this.getValidatedData<typeof this.schema>()
        const { username, password } = data.body

        // Find user by email or username
        const user = await c.env.DB.prepare(
            'SELECT * FROM users WHERE email = ? OR username = ?'
        )
            .bind(username, username)
            .first<User>()

        if (!user || !user.password_hash) {
            return Response.json(
                {
                    error: 'Unauthorized',
                    message: 'Invalid credentials',
                    status: 401,
                },
                { status: 401 }
            )
        }

        // Verify password
        const isValidPassword = await verifyPassword(
            password,
            user.password_hash
        )

        if (!isValidPassword) {
            return Response.json(
                {
                    error: 'Unauthorized',
                    message: 'Invalid credentials',
                    status: 401,
                },
                { status: 401 }
            )
        }

        if (!user.email_verified) {
            return Response.json(
                {
                    error: 'Forbidden',
                    message: 'Please verify your email before logging in',
                    status: 403,
                },
                { status: 403 }
            )
        }

        // Generate JWT token
        const token = await generateToken(user, c.env.JWT_SECRET)

        return Response.json({
            access_token: token,
            token_type: 'Bearer',
            expires_in: 7 * 24 * 60 * 60,
            user: toUserPublic(user),
        })
    }
}

/**
 * GET /api/auth/me
 * Get current user profile
 */
export class AuthProfile extends OpenAPIRoute {
    schema = {
        tags: ['Authentication'],
        summary: 'Get current user',
        description: 'Retrieve the authenticated user profile',
        security: [{ BearerAuth: [] }],
        responses: {
            '200': {
                description: 'User profile',
                ...contentJson(UserPublicSchema),
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

        return Response.json(toUserPublic(result.user))
    }
}

/**
 * POST /api/auth/logout
 * Logout user
 */
export class AuthLogout extends OpenAPIRoute {
    schema = {
        tags: ['Authentication'],
        summary: 'User logout',
        description: 'Logout the current user (client-side token removal)',
        security: [{ BearerAuth: [] }],
        responses: {
            '200': {
                description: 'Logout successful',
                ...contentJson(MessageResponseSchema),
            },
        },
    }

    async handle(_c: AppContext) {
        return Response.json({
            message: 'Logged out successfully',
        })
    }
}
