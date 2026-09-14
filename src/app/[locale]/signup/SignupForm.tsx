'use client'

import { useState, useMemo } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { Country, City } from 'country-state-city'
import { useTranslations, useLocale } from 'next-intl'
import { registerUser, type HigherEducationEntry, type JobEntry } from '../actions/register'
import { Link } from '@/i18n/navigation'

const currentYear = new Date().getFullYear()
const days = Array.from({ length: 31 }, (_, i) => i + 1)
const months = Array.from({ length: 12 }, (_, i) => i + 1)
const birthYears = Array.from({ length: 83 }, (_, i) => currentYear - 18 - i)

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-sm font-medium text-gray-700">{label}</label>
      {children}
    </div>
  )
}

function PasswordField({
  label,
  value,
  onChange,
}: {
  label: string
  value: string
  onChange: (v: string) => void
}) {
  const [visible, setVisible] = useState(false)
  return (
    <Field label={label}>
      <div className="relative">
        <input
          type={visible ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="input pe-10"
        />
        <button
          type="button"
          onClick={() => setVisible(!visible)}
          className="absolute end-2 top-1/2 -translate-y-1/2 text-gray-400"
          tabIndex={-1}
        >
          {visible ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>
    </Field>
  )
}

export default function SignupForm() {
  const t = useTranslations('Auth')
  const locale = useLocale()

  const [step, setStep] = useState<1 | 2>(1)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [countryCode, setCountryCode] = useState('')
  const [city, setCity] = useState('')
  const [day, setDay] = useState('')
  const [month, setMonth] = useState('')
  const [year, setYear] = useState('')
  const [gender, setGender] = useState<'male' | 'female' | ''>('')

  const [bio, setBio] = useState('')
  const [phone, setPhone] = useState('')
  const [baseDegree, setBaseDegree] = useState<'diploma' | 'bachelor' | ''>('')
  const [baseUniversity, setBaseUniversity] = useState('')
  const [baseGraduationYear, setBaseGraduationYear] = useState('')
  const [higherEducation, setHigherEducation] = useState<HigherEducationEntry[]>([])
  const [jobs, setJobs] = useState<JobEntry[]>([])
  const [agreedToTerms, setAgreedToTerms] = useState(false)

  const countries = useMemo(() => Country.getAllCountries(), [])
  const cities = useMemo(
    () => (countryCode ? City.getCitiesOfCountry(countryCode) ?? [] : []),
    [countryCode]
  )
  const selectedCountry = useMemo(
    () => countries.find((c) => c.isoCode === countryCode),
    [countries, countryCode]
  )

  function handleNext() {
    if (!firstName || !lastName || !email || !password || !confirmPassword || !countryCode || !city || !day || !month || !year || !gender) {
      setError(locale === 'ar' ? 'يرجى إكمال جميع الحقول' : 'Please fill all fields')
      return
    }
    if (password !== confirmPassword) {
      setError(t('passwordMismatchError'))
      return
    }
    const dob = new Date(Number(year), Number(month) - 1, Number(day))
    const age = (Date.now() - dob.getTime()) / (1000 * 60 * 60 * 24 * 365.25)
    if (age < 18) {
      setError(t('ageError'))
      return
    }
    setError('')
    setStep(2)
  }

  function addHigherEducation() {
    if (higherEducation.length >= 5) return
    setHigherEducation([...higherEducation, { university: '', degree: 'higher_diploma', yearObtained: currentYear }])
  }
  function updateHigherEducation(i: number, field: keyof HigherEducationEntry, value: string | number) {
    const updated = [...higherEducation]
    updated[i] = { ...updated[i], [field]: value }
    setHigherEducation(updated)
  }
  function removeHigherEducation(i: number) {
    setHigherEducation(higherEducation.filter((_, idx) => idx !== i))
  }

  function addJob() {
    if (jobs.length >= 5) return
    setJobs([...jobs, { employer: '', jobTitle: '', startYear: currentYear }])
  }
  function updateJob(i: number, field: keyof JobEntry, value: string | number) {
    const updated = [...jobs]
    updated[i] = { ...updated[i], [field]: value }
    setJobs(updated)
  }
  function removeJob(i: number) {
    setJobs(jobs.filter((_, idx) => idx !== i))
  }

  async function handleSubmit() {
    if (!agreedToTerms) {
      setError(t('termsLabel'))
      return
    }
    setError('')
    setSubmitting(true)

    const dateOfBirth = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    const fullPhone = phone ? `+${selectedCountry?.phonecode ?? ''}${phone}` : undefined

    await registerUser({
      firstName,
      lastName,
      email,
      password,
      country: selectedCountry?.name ?? '',
      city,
      dateOfBirth,
      gender: gender as 'male' | 'female',
      bio: bio || undefined,
      phone: fullPhone,
      baseDegree: baseDegree || undefined,
      baseUniversity: baseUniversity || undefined,
      baseGraduationYear: baseGraduationYear ? Number(baseGraduationYear) : undefined,
      higherEducation,
      jobs,
      locale,
    })
  }

  return (
    <div className="w-full max-w-md flex flex-col gap-5">
      {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}

      {step === 1 ? (
        <div className="flex flex-col gap-4">
          <h2 className="text-base font-semibold text-primary-700">{t('section1Title')}</h2>

          <div className="grid grid-cols-2 gap-3">
            <Field label={t('firstNameLabel')}>
              <input value={firstName} onChange={(e) => setFirstName(e.target.value)} className="input" />
            </Field>
            <Field label={t('lastNameLabel')}>
              <input value={lastName} onChange={(e) => setLastName(e.target.value)} className="input" />
            </Field>
          </div>

          <Field label={t('emailLabel')}>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="input" />
          </Field>

          <PasswordField label={t('passwordLabel')} value={password} onChange={setPassword} />
          <PasswordField label={t('confirmPasswordLabel')} value={confirmPassword} onChange={setConfirmPassword} />

          <div className="grid grid-cols-2 gap-3">
            <Field label={t('countryLabel')}>
              <select
                value={countryCode}
                onChange={(e) => { setCountryCode(e.target.value); setCity('') }}
                className="input"
              >
                <option value="">-</option>
                {countries.map((c) => (
                  <option key={c.isoCode} value={c.isoCode}>{c.name}</option>
                ))}
              </select>
            </Field>
            <Field label={t('cityLabel')}>
              <select value={city} onChange={(e) => setCity(e.target.value)} className="input" disabled={!countryCode}>
                <option value="">-</option>
                {cities.map((ct) => (
                  <option key={ct.name} value={ct.name}>{ct.name}</option>
                ))}
              </select>
            </Field>
          </div>

          <Field label={t('dobLabel')}>
            <div className="grid grid-cols-3 gap-2">
              <select value={day} onChange={(e) => setDay(e.target.value)} className="input">
                <option value="">{t('dayLabel')}</option>
                {days.map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
              <select value={month} onChange={(e) => setMonth(e.target.value)} className="input">
                <option value="">{t('monthLabel')}</option>
                {months.map((m) => <option key={m} value={m}>{m}</option>)}
              </select>
              <select value={year} onChange={(e) => setYear(e.target.value)} className="input">
                <option value="">{t('yearLabel')}</option>
                {birthYears.map((y) => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
          </Field>

          <Field label={t('genderLabel')}>
            <select value={gender} onChange={(e) => setGender(e.target.value as 'male' | 'female')} className="input">
              <option value="">-</option>
              <option value="male">{t('maleOption')}</option>
              <option value="female">{t('femaleOption')}</option>
            </select>
          </Field>

          <button type="button" onClick={handleNext} className="btn-primary">
            {t('nextButton')}
          </button>

          <Link href="/login" className="text-center text-sm text-gray-500 hover:text-primary-600">
            {t('backToLoginButton')}
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <h2 className="text-base font-semibold text-primary-700">{t('section2Title')}</h2>

          <Field label={t('bioLabel')}>
            <textarea value={bio} maxLength={150} onChange={(e) => setBio(e.target.value)} className="input min-h-20" />
            <span className="text-xs text-gray-500">{t('bioRemaining', { count: 150 - bio.length })}</span>
          </Field>

          <Field label={t('phoneLabel')}>
            <div className="flex gap-2">
              <span className="input w-16 flex items-center justify-center bg-gray-50">
                +{selectedCountry?.phonecode ?? '--'}
              </span>
              <input value={phone} onChange={(e) => setPhone(e.target.value)} className="input flex-1" />
            </div>
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label={t('baseDegreeLabel')}>
              <select value={baseDegree} onChange={(e) => setBaseDegree(e.target.value as 'diploma' | 'bachelor')} className="input">
                <option value="">-</option>
                <option value="diploma">{t('diplomaOption')}</option>
                <option value="bachelor">{t('bachelorOption')}</option>
              </select>
            </Field>
            <Field label={t('baseGraduationYearLabel')}>
              <input type="number" value={baseGraduationYear} onChange={(e) => setBaseGraduationYear(e.target.value)} className="input" />
            </Field>
          </div>
          <Field label={t('baseUniversityLabel')}>
            <input value={baseUniversity} onChange={(e) => setBaseUniversity(e.target.value)} className="input" />
          </Field>

          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-700">{t('higherEducationTitle')}</h3>
              {higherEducation.length < 5 && (
                <button type="button" onClick={addHigherEducation} className="text-xs text-primary-600 font-medium">
                  {t('addHigherEducation')}
                </button>
              )}
            </div>
            {higherEducation.map((entry, i) => (
              <div key={i} className="border border-gray-200 rounded-lg p-3 flex flex-col gap-2">
                <input
                  placeholder={t('universityLabel')}
                  value={entry.university}
                  onChange={(e) => updateHigherEducation(i, 'university', e.target.value)}
                  className="input"
                />
                <div className="grid grid-cols-2 gap-2">
                  <select value={entry.degree} onChange={(e) => updateHigherEducation(i, 'degree', e.target.value)} className="input">
                    <option value="higher_diploma">{t('higherDiplomaOption')}</option>
                    <option value="master">{t('masterOption')}</option>
                    <option value="phd">{t('phdOption')}</option>
                  </select>
                  <input
                    type="number"
                    placeholder={t('yearObtainedLabel')}
                    value={entry.yearObtained}
                    onChange={(e) => updateHigherEducation(i, 'yearObtained', Number(e.target.value))}
                    className="input"
                  />
                </div>
                <button type="button" onClick={() => removeHigherEducation(i)} className="text-xs text-red-500 self-start">
                  {t('removeButton')}
                </button>
              </div>
            ))}
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-700">{t('jobHistoryTitle')}</h3>
              {jobs.length < 5 && (
                <button type="button" onClick={addJob} className="text-xs text-primary-600 font-medium">
                  {t('addJob')}
                </button>
              )}
            </div>
            {jobs.map((entry, i) => (
              <div key={i} className="border border-gray-200 rounded-lg p-3 flex flex-col gap-2">
                <input
                  placeholder={t('employerLabel')}
                  value={entry.employer}
                  onChange={(e) => updateJob(i, 'employer', e.target.value)}
                  className="input"
                />
                <input
                  placeholder={t('jobTitleLabel')}
                  value={entry.jobTitle}
                  onChange={(e) => updateJob(i, 'jobTitle', e.target.value)}
                  className="input"
                />
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="number"
                    placeholder={t('startYearLabel')}
                    value={entry.startYear}
                    onChange={(e) => updateJob(i, 'startYear', Number(e.target.value))}
                    className="input"
                  />
                  <input
                    type="number"
                    placeholder={t('endYearLabel')}
                    value={entry.endYear ?? ''}
                    onChange={(e) => updateJob(i, 'endYear', Number(e.target.value))}
                    className="input"
                  />
                </div>
                <button type="button" onClick={() => removeJob(i)} className="text-xs text-red-500 self-start">
                  {t('removeButton')}
                </button>
              </div>
            ))}
          </div>

          <label className="flex items-start gap-2 text-sm text-gray-700">
            <input type="checkbox" checked={agreedToTerms} onChange={(e) => setAgreedToTerms(e.target.checked)} className="mt-1" />
            {t('termsLabel')}
          </label>

          <div className="flex gap-3">
            <button type="button" onClick={() => setStep(1)} className="flex-1 rounded-lg border border-gray-300 py-2.5 font-medium text-gray-700">
              {t('backButton')}
            </button>
            <button type="button" onClick={handleSubmit} disabled={submitting} className="flex-1 btn-primary disabled:opacity-60">
              {t('registerButton')}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
