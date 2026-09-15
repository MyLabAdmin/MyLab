'use client'

import { useState, useEffect, useCallback } from 'react'
import { searchMediaLibrary } from '@/app/[locale]/actions/media-library'

export default function MediaLibraryPicker({
  scope,
  onSelect,
}: {
  scope: string
  onSelect: (ref: string, previewUrl: string) => void
}) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<{ id: string; name: string; ref: string; previewUrl: string }[]>([])
  const [loading, setLoading] = useState(true)

  const search = useCallback(async (q: string) => {
    setLoading(true)
    const data = await searchMediaLibrary(q, scope)
    setResults(data)
    setLoading(false)
  }, [scope])

  useEffect(() => {
    search('')
  }, [search])

  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-2">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), search(query))}
          placeholder="Search..."
          className="input flex-1"
        />
        <button type="button" onClick={() => search(query)} className="btn-primary w-auto px-4">
          {loading ? '...' : 'Search'}
        </button>
      </div>
      {loading ? (
        <p className="text-xs text-gray-400 text-center py-4">...</p>
      ) : results.length === 0 ? (
        <p className="text-xs text-gray-400 text-center py-4">No images yet</p>
      ) : (
        <div className="grid grid-cols-3 gap-2 max-h-48 overflow-y-auto">
          {results.map((r) => (
            <button
              key={r.id}
              type="button"
              onClick={() => onSelect(r.ref, r.previewUrl)}
              className="border border-gray-200 rounded-lg overflow-hidden hover:border-primary-500"
            >
              <img src={r.previewUrl} alt={r.name} className="w-full h-16 object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
