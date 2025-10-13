/**
 * Validation utilities
 */

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
}

/**
 * Validate username format
 * - 3-20 characters
 * - Only alphanumeric, underscore, and hyphen
 * - Must start with a letter
 */
export function isValidUsername(username: string): boolean {
    const usernameRegex = /^[a-zA-Z][a-zA-Z0-9_-]{2,19}$/
    return usernameRegex.test(username)
}

/**
 * Validate verification code format (6 digits)
 */
export function isValidVerificationCode(code: string): boolean {
    return /^\d{6}$/.test(code)
}

/**
 * Sanitize user input to prevent XSS
 */
export function sanitizeInput(input: string): string {
    return input
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;')
        .replace(/\//g, '&#x2F;')
}

/**
 * Generate random verification code (6 digits)
 */
export function generateVerificationCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString()
}

/**
 * Generate unique ID (UUID v4)
 */
export function generateId(): string {
    return crypto.randomUUID()
}

/**
 * Hash string using SHA-256 (for IP addresses, etc.)
 */
export async function hashString(input: string): Promise<string> {
    const encoder = new TextEncoder()
    const data = encoder.encode(input)
    const hashBuffer = await crypto.subtle.digest('SHA-256', data)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

/**
 * Parse pagination parameters
 */
export function parsePagination(url: URL): { page: number; limit: number } {
    const page = Math.max(1, parseInt(url.searchParams.get('page') || '1', 10))
    const limit = Math.min(
        100,
        Math.max(1, parseInt(url.searchParams.get('limit') || '20', 10))
    )

    return { page, limit }
}

/**
 * Get current Unix timestamp in seconds
 */
export function getCurrentTimestamp(): number {
    return Math.floor(Date.now() / 1000)
}

/**
 * Get current date string (YYYY-MM-DD)
 */
export function getCurrentDate(): string {
    return new Date().toISOString().split('T')[0]
}
