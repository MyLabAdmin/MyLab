'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { updateProfile, updateProfileVisibility } from '@/app/[locale]/actions/profile'

type ProfileData = {
  display_name: string | null
  first_name: string | null
  last_name: string | null
  bio: string | null
  country: string | null
  city: string | null
  date_of_birth: string | null
  gender: string | null
  phone: string | null
  base_degree: string | null
  base_university: string | null
  base_graduation_year: number | null
}

type Visibility = Record<string, boolean>

type Props = {
  profile: ProfileData
  visibility: Visibility
  isArabic: boolean
}

const fields = [
  'first_name',
  'last_name',
  'bio',
  'country',
  'city',
  'date_of_birth',
  'gender',
  'phone',
  'base_degree',
  'base_university',
  'base_graduation_year',
] as const

type EditableField = (typeof fields)[number]

export default function ProfilePersonalEdit({
  profile,
  visibility,
  isArabic,
}: Props) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    first_name: profile.first_name ?? '',
    last_name: profile.last_name ?? '',
    bio: profile.bio ?? '',
    country: profile.country ?? '',
    city: profile.city ?? '',
    date_of_birth: profile.date_of_birth ?? '',
    gender: profile.gender ?? '',
    phone: profile.phone ?? '',
    base_degree: profile.base_degree ?? '',
    base_university: profile.base_university ?? '',
    base_graduation_year: profile.base_graduation_year?.toString() ?? '',
  })

  const [publicFields, setPublicFields] = useState<Record<EditableField, boolean>>(
    Object.fromEntries(
      fields.map((field) => [field, visibility[field] !== false]),
    ) as Record<EditableField, boolean>,
  )

  function setField(field: EditableField, value: string) {
    setForm((current) => ({ ...current, [field]: value }))
  }

  async function handleSave() {
    setSaving(true)
    setError('')

    const result = await updateProfile({
firstName: form.first_name,
      lastName: form.last_name,
      bio: form.bio,
      country: form.country,
      dateOfBirth: form.date_of_birth,
      gender: form.gender as 'male' | 'female' | '',
      city: form.city,
      phone: form.phone,
      baseDegree: form.base_degree as 'diploma' | 'bachelor' | '',
      baseUniversity: form.base_university,
      baseGraduationYear: form.base_graduation_year
        ? Number(form.base_graduation_year)
        : null,
    })

    if (!result.success) {
      setError(result.error)
      setSaving(false)
      return
    }

    const visibilityResult = await updateProfileVisibility(publicFields)

    if (!visibilityResult.success) {
      setError(visibilityResult.error)
      setSaving(false)
      return
    }

    setSaving(false)
    setOpen(false)
    router.refresh()
  }

  const label = (field: EditableField) => {
    const labels: Record<EditableField, [string, string]> = {
      first_name: ['الاسم الأول', 'First name'],
      last_name: ['اسم العائلة', 'Last name'],
      bio: ['نبذة', 'Bio'],
      country: ['الدولة', 'Country'],
      city: ['المدينة', 'City'],
      date_of_birth: ['تاريخ الميلاد', 'Date of birth'],
      gender: ['الجنس', 'Gender'],
      phone: ['الهاتف', 'Phone'],
      base_degree: ['الدرجة الأساسية', 'Base degree'],
      base_university: ['الجامعة الأساسية', 'Base university'],
      base_graduation_year: ['سنة التخرج', 'Graduation year'],
    }

    return isArabic ? labels[field][0] : labels[field][1]
  }

  const visibilityLabel = (field: EditableField) => (
    <select
      value={publicFields[field] ? 'public' : 'private'}
      onChange={(event) =>
        setPublicFields((current) => ({
          ...current,
          [field]: event.target.value === 'public',
        }))
      }
      className="rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs font-medium text-gray-700"
      aria-label={label(field)}
    >
      <option value="public">{isArabic ? 'عام' : 'Public'}</option>
      <option value="private">{isArabic ? 'خاص' : 'Private'}</option>
    </select>
  )

  function renderInput(field: EditableField) {
    const value = form[field]

    if (field === 'bio') {
      return (
        <textarea
          value={value}
          onChange={(event) => setField(field, event.target.value)}
          maxLength={150}
          rows={4}
          className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-primary-500"
        />
      )
    }

    if (field === 'gender') {
      return (
        <select
          value={value}
          onChange={(event) => setField(field, event.target.value)}
          className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-primary-500"
        >
          <option value="">—</option>
          <option value="male">{isArabic ? 'ذكر' : 'Male'}</option>
          <option value="female">{isArabic ? 'أنثى' : 'Female'}</option>
        </select>
      )
    }

    if (field === 'base_degree') {
      return (
        <select
          value={value}
          onChange={(event) => setField(field, event.target.value)}
          className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-primary-500"
        >
          <option value="">—</option>
          <option value="diploma">{isArabic ? 'دبلوم' : 'Diploma'}</option>
          <option value="bachelor">{isArabic ? 'بكالوريوس' : 'Bachelor'}</option>
        </select>
      )
    }

    return (
      <input
        type={
          field === 'date_of_birth'
            ? 'date'
            : field === 'base_graduation_year'
              ? 'number'
              : field === 'phone'
                ? 'tel'
                : 'text'
        }
        value={value}
        onChange={(event) => setField(field, event.target.value)}
        className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-primary-500"
      />
    )
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-700 transition hover:bg-gray-50"
      >
        {isArabic ? 'تعديل' : 'Edit'}
      </button>

      {open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div
            role="dialog"
            aria-modal="true"
            className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-5 shadow-xl"
          >
            <div className="mb-5 flex items-center justify-between gap-3">
              <div>
                <h2 className="font-bold text-gray-900">
                  {isArabic ? 'تعديل المعلومات الشخصية' : 'Edit personal information'}
                </h2>
                <p className="mt-1 text-xs text-gray-500">
                  {isArabic
                    ? 'كل الحقول عامة افتراضيًا ويمكن جعل أي حقل خاصًا.'
                    : 'All fields are public by default and can be made private.'}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-1.5 text-sm text-gray-500 hover:bg-gray-100"
              >
                ×
              </button>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {fields.map((field) => (
                <div
                  key={field}
                  className={field === 'bio' ? 'sm:col-span-2' : ''}
                >
                  <div className="mb-1.5 flex items-center justify-between gap-2">
                    <label className="text-xs font-semibold text-gray-700">
                      {label(field)}
                    </label>
                    {visibilityLabel(field)}
                  </div>
                  {renderInput(field)}
                </div>
              ))}
            </div>

            {error ? (
              <p className="mt-4 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">
                {error}
              </p>
            ) : null}

            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                disabled={saving}
                onClick={() => setOpen(false)}
                className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 disabled:opacity-50"
              >
                {isArabic ? 'إلغاء' : 'Cancel'}
              </button>

              <button
                type="button"
                disabled={saving}
                onClick={handleSave}
                className="rounded-xl bg-primary-600 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving
                  ? isArabic
                    ? 'جارٍ الحفظ...'
                    : 'Saving...'
                  : isArabic
                    ? 'حفظ'
                    : 'Save'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  )
}
