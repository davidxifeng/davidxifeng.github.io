/**
 * Response utilities for consistent API responses
 */

import type { ErrorResponse } from '../types'

/**
 * Create a successful JSON response
 */
export function jsonResponse<T>(data: T, status = 200): Response {
    return new Response(JSON.stringify(data), {
        status,
        headers: {
            'Content-Type': 'application/json',
        },
    })
}

/**
 * Create an error response
 */
export function errorResponse(
    message: string,
    status = 400,
    error = 'Bad Request',
    details?: any
): Response {
    const errorData: ErrorResponse = {
        error,
        message,
        status,
        details,
    }

    return new Response(JSON.stringify(errorData), {
        status,
        headers: {
            'Content-Type': 'application/json',
        },
    })
}

/**
 * Common error responses
 */
export const Errors = {
    badRequest: (message: string, details?: any) =>
        errorResponse(message, 400, 'Bad Request', details),

    unauthorized: (message = 'Unauthorized') =>
        errorResponse(message, 401, 'Unauthorized'),

    forbidden: (message = 'Forbidden') =>
        errorResponse(message, 403, 'Forbidden'),

    notFound: (message = 'Not Found') =>
        errorResponse(message, 404, 'Not Found'),

    conflict: (message: string) => errorResponse(message, 409, 'Conflict'),

    tooManyRequests: (message = 'Too Many Requests') =>
        errorResponse(message, 429, 'Too Many Requests'),

    internalError: (message = 'Internal Server Error') =>
        errorResponse(message, 500, 'Internal Server Error'),
}

/**
 * Add CORS headers to response
 */
export function addCorsHeaders(
    response: Response,
    allowedOrigins: string
): Response {
    const headers = new Headers(response.headers)

    // Parse allowed origins
    const origins = allowedOrigins.split(',').map(o => o.trim())

    // For development, allow all origins
    // For production, check against allowed origins
    headers.set('Access-Control-Allow-Origin', origins[0] || '*')
    headers.set(
        'Access-Control-Allow-Methods',
        'GET, POST, PUT, DELETE, OPTIONS'
    )
    headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
    headers.set('Access-Control-Max-Age', '86400')

    return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers,
    })
}

/**
 * Handle OPTIONS request (CORS preflight)
 */
export function handleOptions(allowedOrigins: string): Response {
    const headers = new Headers()
    const origins = allowedOrigins.split(',').map(o => o.trim())

    headers.set('Access-Control-Allow-Origin', origins[0] || '*')
    headers.set(
        'Access-Control-Allow-Methods',
        'GET, POST, PUT, DELETE, OPTIONS'
    )
    headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
    headers.set('Access-Control-Max-Age', '86400')

    return new Response(null, {
        status: 204,
        headers,
    })
}
