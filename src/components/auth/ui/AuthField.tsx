'use client'

import { useState } from 'react'
import type { InputHTMLAttributes } from 'react'
import { useTranslations } from 'next-intl'

type AuthFieldProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string
  error?: string
  passwordToggle?: boolean
}

function EyeIcon({ visible }: { visible: boolean }) {
  if (visible) {
    return (
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        className="h-5 w-5"
      >
        <path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z" />
        <circle cx="12" cy="12" r="2.75" />
      </svg>
    )
  }

  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className="h-5 w-5"
    >
      <path d="m3 3 18 18" />
      <path d="M10.6 6.2A10.7 10.7 0 0 1 12 6c6 0 9.5 6 9.5 6a17.7 17.7 0 0 1-3.1 3.8" />
      <path d="M6.2 6.9C3.9 8.5 2.5 12 2.5 12s3.5 6 9.5 6c1.4 0 2.6-.3 3.7-.8" />
      <path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" />
    </svg>
  )
}

export function AuthField({
  label,
  error,
  id,
  type,
  className = '',
  passwordToggle = false,
  ...props
}: AuthFieldProps) {
  const t = useTranslations('common')
  const [passwordVisible, setPasswordVisible] = useState(false)

  const fieldId = id ?? props.name
  const isPassword = type === 'password'
  const showToggle = isPassword && passwordToggle
  const inputType = showToggle && passwordVisible ? 'text' : type

  return (
    <div className="space-y-2">
      <label
        htmlFor={fieldId}
        className="block text-sm font-medium text-neutral-800"
      >
        {label}
      </label>

      <div className="relative">
        <input
          id={fieldId}
          type={inputType}
          className={`block w-full rounded-lg border border-neutral-300 bg-white px-3.5 py-2.5 text-sm text-neutral-900 shadow-sm outline-none transition placeholder:text-neutral-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-100 disabled:cursor-not-allowed disabled:bg-neutral-100 ${
            showToggle ? 'pe-11' : ''
          } ${className}`}
          {...props}
        />

        {showToggle ? (
          <button
            type="button"
            onClick={() => setPasswordVisible((visible) => !visible)}
            className="absolute end-0 top-0 flex h-full w-11 items-center justify-center text-neutral-500 transition hover:text-neutral-700 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-primary-600"
            aria-label={
              passwordVisible
                ? t('hidePassword')
                : t('showPassword')
            }
            aria-pressed={passwordVisible}
          >
            <EyeIcon visible={passwordVisible} />
          </button>
        ) : null}
      </div>

      {error ? (
        <p className="text-sm text-danger-700" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  )
}
