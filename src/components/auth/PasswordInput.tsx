'use client'

import { useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'

export default function PasswordInput({
  name,
  label,
  autoComplete = 'current-password',
}: {
  name: string
  label: string
  autoComplete?: string
}) {
  const [visible, setVisible] = useState(false)

  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={name} className="text-sm font-medium text-gray-700">
        {label}
      </label>
      <div className="relative">
        <input
          id={name}
          name={name}
          type={visible ? 'text' : 'password'}
          autoComplete={autoComplete}
          required
          className="w-full rounded-lg border border-gray-300 px-3 py-2 pe-10 focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
        <button
          type="button"
          onClick={() => setVisible(!visible)}
          className="absolute end-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-primary-600"
          tabIndex={-1}
        >
          {visible ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>
    </div>
  )
}
