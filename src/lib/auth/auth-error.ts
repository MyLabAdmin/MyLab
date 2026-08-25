export type AuthErrorKey =
  | 'invalidCredentials'
  | 'emailAlreadyRegistered'
  | 'invalidEmail'
  | 'weakPassword'
  | 'rateLimited'
  | 'generic'

export function mapAuthError(message: string): AuthErrorKey {
  const normalized = message.toLowerCase()

  if (
    normalized.includes('invalid login credentials') ||
    normalized.includes('invalid credentials')
  ) {
    return 'invalidCredentials'
  }

  if (
    normalized.includes('user already registered') ||
    normalized.includes('already registered')
  ) {
    return 'emailAlreadyRegistered'
  }

  if (
    normalized.includes('invalid email') ||
    normalized.includes('unable to validate email')
  ) {
    return 'invalidEmail'
  }

  if (
    normalized.includes('password') &&
    (
      normalized.includes('weak') ||
      normalized.includes('at least') ||
      normalized.includes('too short')
    )
  ) {
    return 'weakPassword'
  }

  if (
    normalized.includes('rate limit') ||
    normalized.includes('too many requests')
  ) {
    return 'rateLimited'
  }

  return 'generic'
}
