'use client'

import { FormEvent, useState } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { useRouter } from '@/i18n/navigation'
import { createClient } from '@/lib/supabase/client'
import { AuthError } from '@/components/auth/ui/AuthError'
import { AuthField } from '@/components/auth/ui/AuthField'
import { AuthSubmitButton } from '@/components/auth/ui/AuthSubmitButton'

type Gender = 'male' | 'female'

export function ProfileCompletionForm() {
  const locale = useLocale()
  const router = useRouter()
  const t = useTranslations('profile')
  const supabase = createClient()

  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [city, setCity] = useState('')
  const [countryCode, setCountryCode] = useState('')
  const [gender, setGender] = useState<Gender>('male')
  const [dateOfBirth, setDateOfBirth] = useState('')
  const [phone, setPhone] = useState('')
  const [bio, setBio] = useState('')

  const [university, setUniversity] = useState('')
  const [degree, setDegree] = useState<'diploma' | 'bachelor'>('bachelor')
  const [specialty, setSpecialty] = useState('')
  const [fromYear, setFromYear] = useState('')
  const [toYear, setToYear] = useState('')

  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setLoading(true)

    const undergraduate =
      university.trim() &&
      specialty.trim() &&
      fromYear &&
      toYear
        ? {
            university: university.trim(),
            degree,
            specialty: specialty.trim(),
            from_year: Number(fromYear),
            to_year: Number(toYear),
          }
        : null

    const { error } = await supabase.rpc('complete_my_profile', {
      p_first_name: firstName.trim(),
      p_last_name: lastName.trim(),
      p_city: city.trim(),
      p_country_code: countryCode.trim().toUpperCase(),
      p_gender: gender,
      p_date_of_birth: dateOfBirth,
      p_phone: phone.trim() || null,
      p_bio: bio.trim() || null,
      p_undergraduate: undergraduate,
      p_postgraduate: null,
      p_work: null,
      p_avatar_type: 'none',
      p_avatar_path: null,
      p_avatar_preset: null,
    })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    router.push('/dashboard')
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-neutral-900">
          {t('basicInformation')}
        </h2>

        <AuthField
          label={t('firstName')}
          id="profile-first-name"
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
          required
          disabled={loading}
        />

        <AuthField
          label={t('lastName')}
          id="profile-last-name"
          value={lastName}
          onChange={(e) => setLastName(e.target.value)}
          required
          disabled={loading}
        />

        <AuthField
          label={t('city')}
          id="profile-city"
          value={city}
          onChange={(e) => setCity(e.target.value)}
          required
          disabled={loading}
        />

        <AuthField
          label={t('countryCode')}
          id="profile-country-code"
          maxLength={2}
          value={countryCode}
          onChange={(e) => setCountryCode(e.target.value.toUpperCase())}
          required
          disabled={loading}
        />

        <div className="space-y-2">
          <label
            htmlFor="profile-gender"
            className="block text-sm font-medium text-neutral-800"
          >
            {t('gender')}
          </label>

          <select
            id="profile-gender"
            value={gender}
            onChange={(e) => setGender(e.target.value as Gender)}
            disabled={loading}
            className="block w-full rounded-lg border border-neutral-300 bg-white px-3.5 py-2.5 text-sm"
          >
            <option value="male">{t('male')}</option>
            <option value="female">{t('female')}</option>
          </select>
        </div>

        <AuthField
          label={t('dateOfBirth')}
          id="profile-date-of-birth"
          type="date"
          value={dateOfBirth}
          onChange={(e) => setDateOfBirth(e.target.value)}
          required
          disabled={loading}
        />

        <AuthField
          label={t('phone')}
          id="profile-phone"
          type="tel"
          autoComplete="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          disabled={loading}
        />

        <div className="space-y-2">
          <label
            htmlFor="profile-bio"
            className="block text-sm font-medium text-neutral-800"
          >
            {t('bio')}
          </label>

          <textarea
            id="profile-bio"
            maxLength={150}
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            disabled={loading}
            className="block min-h-24 w-full rounded-lg border border-neutral-300 bg-white px-3.5 py-2.5 text-sm"
          />
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-neutral-900">
          {t('undergraduateEducation')}
        </h2>

        <AuthField
          label={t('university')}
          id="profile-university"
          value={university}
          onChange={(e) => setUniversity(e.target.value)}
          disabled={loading}
        />

        <div className="space-y-2">
          <label
            htmlFor="profile-degree"
            className="block text-sm font-medium text-neutral-800"
          >
            {t('degree')}
          </label>

          <select
            id="profile-degree"
            value={degree}
            onChange={(e) =>
              setDegree(e.target.value as 'diploma' | 'bachelor')
            }
            disabled={loading}
            className="block w-full rounded-lg border border-neutral-300 bg-white px-3.5 py-2.5 text-sm"
          >
            <option value="bachelor">{t('bachelor')}</option>
            <option value="diploma">{t('diploma')}</option>
          </select>
        </div>

        <AuthField
          label={t('specialty')}
          id="profile-specialty"
          value={specialty}
          onChange={(e) => setSpecialty(e.target.value)}
          disabled={loading}
        />

        <div className="grid grid-cols-2 gap-4">
          <AuthField
            label={t('fromYear')}
            id="profile-from-year"
            type="number"
            min={1900}
            max={2100}
            value={fromYear}
            onChange={(e) => setFromYear(e.target.value)}
            disabled={loading}
          />

          <AuthField
            label={t('toYear')}
            id="profile-to-year"
            type="number"
            min={1900}
            max={2100}
            value={toYear}
            onChange={(e) => setToYear(e.target.value)}
            disabled={loading}
          />
        </div>
      </section>

      <AuthError message={error} />

      <AuthSubmitButton
        loading={loading}
        loadingLabel={t('saving')}
      >
        {t('continue')}
      </AuthSubmitButton>
    </form>
  )
}
