/**
 * Authentication handlers
 */

import type { Context } from 'hono'
import type {
    Env,
    RegisterRequest,
    LoginRequest,
    AuthResponse,
    UserPublic,
    User,
    VerifyCodeRequest,
} from '../types'
import {
    hashPassword,
    verifyPassword,
    validatePasswordStrength,
} from '../utils/password'
import { generateToken } from '../utils/jwt'
import { jsonResponse, Errors } from '../utils/response'
import {
    isValidEmail,
    isValidUsername,
    isValidVerificationCode,
    generateVerificationCode,
    generateId,
    getCurrentTimestamp,
    sanitizeInput,
} from '../utils/validation'
import { getCurrentUser } from '../middleware/auth'

/**
 * Convert User to UserPublic (remove sensitive fields)
 */
function toUserPublic(user: User): UserPublic {
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
export async function requestVerificationCode(
    c: Context<{ Bindings: Env }>
): Promise<Response> {
    try {
        const body = await c.req.json<VerifyCodeRequest>()
        const { email, type } = body

        // Validate email
        if (!isValidEmail(email)) {
            return Errors.badRequest('Invalid email format')
        }

        // Check if email already exists (for registration)
        if (type === 'register') {
            const existingUser = await c.env.DB.prepare(
                'SELECT id FROM users WHERE email = ?'
            )
                .bind(email)
                .first()

            if (existingUser) {
                return Errors.conflict('Email already registered')
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

        // TODO: Send email with verification code using Resend or similar service
        // For development, return the code in response
        console.log(`Verification code for ${email}: ${code}`)

        return jsonResponse({
            message: 'Verification code sent to your email',
            // Remove this in production!
            dev_code: c.env.ENVIRONMENT === 'development' ? code : undefined,
        })
    } catch (error) {
        console.error('Request verification code error:', error)
        return Errors.internalError('Failed to send verification code')
    }
}

/**
 * POST /api/auth/register
 * Register a new user
 */
export async function register(
    c: Context<{ Bindings: Env }>
): Promise<Response> {
    try {
        const body = await c.req.json<RegisterRequest>()
        const { email, username, password, verification_code, display_name } =
            body

        // Validate input
        if (!isValidEmail(email)) {
            return Errors.badRequest('Invalid email format')
        }

        if (!isValidUsername(username)) {
            return Errors.badRequest(
                'Invalid username. Must be 3-20 characters, start with a letter, and contain only letters, numbers, underscores, and hyphens'
            )
        }

        const passwordValidation = validatePasswordStrength(password)
        if (!passwordValidation.valid) {
            return Errors.badRequest('Weak password', passwordValidation.errors)
        }

        if (!isValidVerificationCode(verification_code)) {
            return Errors.badRequest('Invalid verification code format')
        }

        // Verify verification code
        const verificationRecord = await c.env.DB.prepare(
            'SELECT * FROM verification_codes WHERE email = ? AND code = ? AND type = ? AND used = 0 AND expires_at > ?'
        )
            .bind(email, verification_code, 'register', getCurrentTimestamp())
            .first()

        if (!verificationRecord) {
            return Errors.badRequest('Invalid or expired verification code')
        }

        // Check if email or username already exists
        const existingUser = await c.env.DB.prepare(
            'SELECT id FROM users WHERE email = ? OR username = ?'
        )
            .bind(email, username)
            .first()

        if (existingUser) {
            return Errors.conflict('Email or username already registered')
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
            return Errors.internalError('Failed to create user')
        }

        // Generate JWT token
        const token = await generateToken(user, c.env.JWT_SECRET)

        const response: AuthResponse = {
            access_token: token,
            token_type: 'Bearer',
            expires_in: 7 * 24 * 60 * 60, // 7 days
            user: toUserPublic(user),
        }

        return jsonResponse(response, 201)
    } catch (error) {
        console.error('Register error:', error)
        return Errors.internalError('Failed to register user')
    }
}

/**
 * POST /api/auth/login
 * Login with username/email and password
 */
export async function login(c: Context<{ Bindings: Env }>): Promise<Response> {
    try {
        const body = await c.req.json<LoginRequest>()
        const { username, password } = body

        // Find user by email or username
        const user = await c.env.DB.prepare(
            'SELECT * FROM users WHERE email = ? OR username = ?'
        )
            .bind(username, username)
            .first<User>()

        if (!user || !user.password_hash) {
            return Errors.unauthorized('Invalid credentials')
        }

        // Verify password
        const isValidPassword = await verifyPassword(
            password,
            user.password_hash
        )

        if (!isValidPassword) {
            return Errors.unauthorized('Invalid credentials')
        }

        if (!user.email_verified) {
            return Errors.forbidden(
                'Please verify your email before logging in'
            )
        }

        // Generate JWT token
        const token = await generateToken(user, c.env.JWT_SECRET)

        const response: AuthResponse = {
            access_token: token,
            token_type: 'Bearer',
            expires_in: 7 * 24 * 60 * 60, // 7 days
            user: toUserPublic(user),
        }

        return jsonResponse(response)
    } catch (error) {
        console.error('Login error:', error)
        return Errors.internalError('Failed to login')
    }
}

/**
 * GET /api/auth/me
 * Get current user profile (requires authentication)
 */
export async function getProfile(
    c: Context<{ Bindings: Env }>
): Promise<Response> {
    const user = getCurrentUser(c)

    if (!user) {
        return Errors.unauthorized()
    }

    return jsonResponse(toUserPublic(user))
}

/**
 * POST /api/auth/logout
 * Logout (client-side token removal, optionally add token to blacklist)
 */
export async function logout(c: Context<{ Bindings: Env }>): Promise<Response> {
    // For JWT-based auth, logout is primarily handled client-side
    // Optionally, you can implement token blacklisting here using sessions table

    return jsonResponse({ message: 'Logged out successfully' })
}
