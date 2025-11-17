import { createClient } from './server'

/**
 * Validates if the current session is still valid (within 24 hours)
 * Returns the user if valid, null if expired or invalid
 */
export async function validateSession() {
  const supabase = await createClient()

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    return null
  }

  return user
}

/**
 * Gets the session expiration time
 * Returns null if no session exists
 */
export async function getSessionExpiration() {
  const supabase = await createClient()

  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    return null
  }

  // Session expires_at is in seconds, convert to milliseconds
  return session.expires_at ? session.expires_at * 1000 : null
}

/**
 * Checks if session will expire soon (within 5 minutes)
 * Useful for showing warnings to users
 */
export async function isSessionExpiringSoon() {
  const expirationTime = await getSessionExpiration()

  if (!expirationTime) {
    return false
  }

  const now = Date.now()
  const fiveMinutes = 5 * 60 * 1000 // 5 minutes in milliseconds

  return expirationTime - now < fiveMinutes
}
