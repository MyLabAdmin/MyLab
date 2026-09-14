'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from '@/i18n/navigation'

export type HigherEducationEntry = {
  university: string
  degree: 'higher_diploma' | 'master' | 'phd'
  yearObtained: number
}

export type JobEntry = {
  employer: string
  jobTitle: string
  startYear: number
  endYear?: number
}

export type SignupPayload = {
  firstName: string
  lastName: string
  email: string
  password: string
  country: string
  city: string
  dateOfBirth: string
  gender: 'male' | 'female'
  bio?: string
  phone?: string
  baseDegree?: 'diploma' | 'bachelor'
  baseUniversity?: string
  baseGraduationYear?: number
  higherEducation: HigherEducationEntry[]
  jobs: JobEntry[]
  locale: string
}

export async function registerUser(data: SignupPayload) {
  const supabase = await createClient()

  const { error: authError } = await supabase.auth.signUp({
    email: data.email,
    password: data.password,
    options: {
      data: {
        first_name: data.firstName,
        last_name: data.lastName,
        country: data.country,
        city: data.city,
        date_of_birth: data.dateOfBirth,
        gender: data.gender,
        bio: data.bio ?? null,
        phone: data.phone ?? null,
        base_degree: data.baseDegree ?? null,
        base_university: data.baseUniversity ?? null,
        base_graduation_year: data.baseGraduationYear ?? null,
        higher_education: data.higherEducation.map((e) => ({
          university: e.university,
          degree: e.degree,
          year_obtained: e.yearObtained,
        })),
        jobs: data.jobs.map((j) => ({
          employer: j.employer,
          job_title: j.jobTitle,
          start_year: j.startYear,
          end_year: j.endYear ?? null,
        })),
      },
    },
  })

  if (authError) {
    redirect({
      href: `/signup?error=${encodeURIComponent(authError.message)}`,
      locale: data.locale,
    })
    return
  }

  redirect({ href: '/signup/check-email', locale: data.locale })
}
