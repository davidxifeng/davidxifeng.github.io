/**
 * Password hashing utilities
 * Uses bcrypt-like algorithm compatible with Web Crypto API
 */

/**
 * Hash a password using SHA-256 with salt
 * Note: This is a simple implementation. For production, consider using
 * a more robust solution or external service.
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.randomUUID()
  const saltedPassword = password + salt

  const encoder = new TextEncoder()
  const data = encoder.encode(saltedPassword)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)

  const hashArray = Array.from(new Uint8Array(hashBuffer))
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')

  // Store as: salt$hash
  return `${salt}$${hashHex}`
}

/**
 * Verify a password against a hash
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  try {
    const [salt, storedHash] = hash.split('$')
    if (!salt || !storedHash) return false

    const saltedPassword = password + salt
    const encoder = new TextEncoder()
    const data = encoder.encode(saltedPassword)
    const hashBuffer = await crypto.subtle.digest('SHA-256', data)

    const hashArray = Array.from(new Uint8Array(hashBuffer))
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')

    return hashHex === storedHash
  } catch (error) {
    console.error('Password verification error:', error)
    return false
  }
}

/**
 * Validate password strength
 */
export function validatePasswordStrength(password: string): {
  valid: boolean
  errors: string[]
} {
  const errors: string[] = []

  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long')
  }

  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter')
  }

  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter')
  }

  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number')
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}
