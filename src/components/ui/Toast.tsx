'use client'

import { createContext, useContext, useState, useCallback } from 'react'

type ToastContextType = { showToast: (message: string) => void }
const ToastContext = createContext<ToastContextType | null>(null)

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used inside ToastProvider')
  return ctx
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [message, setMessage] = useState<string | null>(null)

  const showToast = useCallback((msg: string) => {
    setMessage(msg)
    setTimeout(() => setMessage(null), 2500)
  }, [])

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {message && (
        <div className="fixed bottom-4 inset-x-0 flex justify-center z-[100] pointer-events-none">
          <div className="bg-gray-900 text-white text-sm px-4 py-2 rounded-full shadow-lg">
            {message}
          </div>
        </div>
      )}
    </ToastContext.Provider>
  )
}
