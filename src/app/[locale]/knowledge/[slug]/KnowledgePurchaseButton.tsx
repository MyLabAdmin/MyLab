'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { purchaseKnowledgeItem } from '@/app/[locale]/actions/knowledge'

export default function KnowledgePurchaseButton({
  itemId,
  price,
}: {
  itemId: string
  price: number
}) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handlePurchase() {
    setLoading(true)
    setError('')

    const result = await purchaseKnowledgeItem(itemId)

    if (!result.success) {
      setError(result.error ?? 'Purchase failed')
      setLoading(false)
      return
    }

    router.refresh()
  }

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={handlePurchase}
        disabled={loading}
        className="btn-primary disabled:opacity-60"
      >
        {loading
          ? '...'
          : `Purchase for ${price} Coins`}
      </button>

      {error && (
        <p className="text-sm text-red-600">
          {error}
        </p>
      )}
    </div>
  )
}
