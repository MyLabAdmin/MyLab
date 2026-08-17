type AuthErrorProps = {
  message: string | null
}

export function AuthError({ message }: AuthErrorProps) {
  if (!message) return null

  return (
    <div
      className="rounded-lg border border-danger-500/20 bg-danger-50 px-3.5 py-3 text-sm text-danger-700"
      role="alert"
    >
      {message}
    </div>
  )
}
