'use client'

import { useEffect, useState } from 'react'
import {
  getFeatureCapacityPlans,
  getFeatureCapacityStatus,
  type FeatureCapacityPlan,
  type FeatureCapacityStatus,
} from '@/lib/features/access'
import {
  getWalletBalance,
  purchaseMessageMediaPlan,
} from '@/app/[locale]/actions/wallet'

export default function PostMediaCapacity() {
  const [status, setStatus] = useState<FeatureCapacityStatus | null>(null)
  const [plans, setPlans] = useState<FeatureCapacityPlan[]>([])
  const [walletBalance, setWalletBalance] = useState<number | null>(null)
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [purchasing, setPurchasing] = useState<string | null>(null)

  const isArabic =
    typeof document !== 'undefined' &&
    document.documentElement.lang === 'ar'

  async function load() {
    setLoading(true)

    try {
      const [statusResult, plansResult, walletResult] = await Promise.all([
        getFeatureCapacityStatus('post_media'),
        getFeatureCapacityPlans('post_media'),
        getWalletBalance(),
      ])

      setStatus(statusResult.success ? statusResult.status : null)
      setPlans(plansResult.success ? plansResult.plans : [])
      setWalletBalance(
        walletResult.success ? walletResult.wallet.balance : null,
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [])

  async function purchase(plan: FeatureCapacityPlan) {
    if (purchasing) return

    setPurchasing(plan.id)

    try {
      const result = await purchaseMessageMediaPlan(
        plan.id,
        plan.marketCode,
        plan.currencyCode,
      )

      if (result.success) {
        await load()
      }
    } finally {
      setPurchasing(null)
    }
  }

  function formatDuration(seconds: number) {
    if (seconds >= 86400) {
      const days = Math.max(1, Math.round(seconds / 86400))
      return isArabic ? `${days} يوم` : `${days} days`
    }

    if (seconds >= 3600) {
      const hours = Math.max(1, Math.round(seconds / 3600))
      return isArabic ? `${hours} ساعة` : `${hours} hours`
    }

    const minutes = Math.max(1, Math.round(seconds / 60))
    return isArabic ? `${minutes} دقيقة` : `${minutes} minutes`
  }

  if (loading) return null

  const remaining = status?.totalRemaining ?? 0

  return (
    <div dir={isArabic ? 'rtl' : 'ltr'} className="space-y-2">
      <div className="flex items-center justify-between gap-2 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2">
        <span
          className={
            remaining > 0
              ? 'text-xs font-medium text-gray-600'
              : 'text-xs font-medium text-amber-700'
          }
        >
          🖼️{' '}
          {status
            ? isArabic
              ? `${remaining} متبقية`
              : `${remaining} remaining`
            : isArabic
              ? 'غير متاحة'
              : 'Unavailable'}
        </span>

        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          aria-expanded={open}
          className="flex h-7 w-7 items-center justify-center rounded-lg border border-gray-200 bg-white text-xs text-gray-500"
        >
          ⓘ
        </button>
      </div>

      {open && (
        <div className="rounded-xl border border-gray-200 bg-white p-3 shadow-sm">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-gray-600">
              <span>
                {isArabic ? 'الرصيد المتبقي' : 'Remaining capacity'}
              </span>
              <strong className="text-gray-900">{remaining}</strong>
            </div>

            <div className="flex items-center justify-between text-xs text-gray-600">
              <span>{isArabic ? 'رصيد العملات' : 'Coins balance'}</span>
              <strong className="text-gray-900">
                {walletBalance ?? 0}
              </strong>
            </div>
          </div>

          {plans.length > 0 && (
            <div className="mt-3 space-y-2">
              <p className="text-xs font-semibold text-gray-800">
                {isArabic ? 'شراء سعة إضافية' : 'Buy additional capacity'}
              </p>

              {plans.map((plan) => (
                <div
                  key={plan.id}
                  className="flex items-center justify-between gap-3 rounded-lg border border-gray-200 p-2"
                >
                  <div className="min-w-0">
                    <p className="truncate text-xs font-medium text-gray-900">
                      {isArabic ? plan.nameAr : plan.nameEn}
                    </p>

                    <p className="text-[11px] text-gray-500">
                      {plan.capacityUnits}{' '}
                      {isArabic ? 'صور' : 'images'} ·{' '}
                      {formatDuration(plan.durationSeconds)}
                    </p>
                  </div>

                  <button
                    type="button"
                    disabled={purchasing !== null}
                    onClick={() => void purchase(plan)}
                    className="btn-primary w-auto shrink-0 px-3 py-1.5 text-xs disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {purchasing === plan.id
                      ? isArabic
                        ? 'جارٍ...'
                        : 'Buying...'
                      : `${plan.amount} ${plan.currencyCode}`}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
