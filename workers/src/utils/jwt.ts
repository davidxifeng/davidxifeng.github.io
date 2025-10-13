/**
 * JWT Utilities using jose library
 * Uses Web Crypto API compatible with Cloudflare Workers
 */

import * as jose from 'jose'
import type { JWTPayload, User } from '../types'

const ALGORITHM = 'HS256'
const TOKEN_EXPIRATION = 7 * 24 * 60 * 60 // 7 days in seconds

/**
 * Generate JWT token for a user
 */
export async function generateToken(
    user: User,
    secret: string
): Promise<string> {
    const payload: JWTPayload = {
        sub: user.id,
        email: user.email,
        username: user.username,
        role: user.role,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + TOKEN_EXPIRATION,
    }

    const secretKey = new TextEncoder().encode(secret)

    const token = await new jose.SignJWT(payload)
        .setProtectedHeader({ alg: ALGORITHM })
        .setIssuedAt()
        .setExpirationTime('7d')
        .sign(secretKey)

    return token
}

/**
 * Verify and decode JWT token
 */
export async function verifyToken(
    token: string,
    secret: string
): Promise<JWTPayload | null> {
    try {
        const secretKey = new TextEncoder().encode(secret)

        const { payload } = await jose.jwtVerify(token, secretKey, {
            algorithms: [ALGORITHM],
        })

        return payload as JWTPayload
    } catch (error) {
        console.error('JWT verification failed:', error)
        return null
    }
}

/**
 * Extract token from Authorization header
 */
export function extractToken(authHeader: string | null): string | null {
    if (!authHeader) return null

    const parts = authHeader.split(' ')
    if (parts.length !== 2 || parts[0] !== 'Bearer') return null

    return parts[1]
}

/**
 * Get token expiration time
 */
export function getTokenExpiration(): number {
    return TOKEN_EXPIRATION
}
