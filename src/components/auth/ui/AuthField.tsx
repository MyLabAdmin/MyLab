import type { InputHTMLAttributes } from 'react'

type AuthFieldProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string
  error?: string
}

export function AuthField({
  label,
  error,
  id,
  className = '',
  ...props
}: AuthFieldProps) {
  const fieldId = id ?? props.name

  return (
    <div className="space-y-2">
      <label
        htmlFor={fieldId}
        className="block text-sm font-medium text-neutral-800"
      >
        {label}
      </label>

      <input
        id={fieldId}
        className={`block w-full rounded-lg border border-neutral-300 bg-white px-3.5 py-2.5 text-sm text-neutral-900 shadow-sm outline-none transition placeholder:text-neutral-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-100 disabled:cursor-not-allowed disabled:bg-neutral-100 ${className}`}
        {...props}
      />

      {error ? (
        <p className="text-sm text-danger-700" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  )
}
