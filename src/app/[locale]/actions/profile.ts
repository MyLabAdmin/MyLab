'use server'

import { makeMediaRef, parseMediaRef } from '@/lib/storage'
import { createClient } from '@/lib/supabase/server'
import { deleteImagekitFileByPath } from '@/lib/storage/imagekit-server'

type UpdateProfileInput = {
  displayName?: string
  firstName: string
  lastName: string
  bio: string
  country: string
  dateOfBirth: string
  gender: 'male' | 'female' | ''
  city: string
  phone: string
  baseDegree: 'diploma' | 'bachelor' | ''
  baseUniversity: string
  baseGraduationYear: number | null
}

export async function updateProfile(
  input: UpdateProfileInput,
): Promise<{ success: true } | { success: false; error: string }> {
  const supabase = await createClient()
  const { data: userData, error: userError } = await supabase.auth.getUser()

  if (userError || !userData.user) {
    return { success: false, error: 'Not authenticated' }
  }

  const displayName = input.displayName?.trim() ?? ''
  const firstName = input.firstName.trim()
  const lastName = input.lastName.trim()
  const bio = input.bio.trim()
  const country = input.country.trim()
  const dateOfBirth = input.dateOfBirth.trim()
  const city = input.city.trim()
  const phone = input.phone.trim()
  const baseUniversity = input.baseUniversity.trim()

  if (bio.length > 150) {
    return { success: false, error: 'Bio must be 150 characters or less' }
  }

  if (input.gender !== '' && input.gender !== 'male' && input.gender !== 'female') {
    return { success: false, error: 'Invalid gender' }
  }

  if (
    input.baseDegree !== '' &&
    input.baseDegree !== 'diploma' &&
    input.baseDegree !== 'bachelor'
  ) {
    return { success: false, error: 'Invalid base degree' }
  }

  if (dateOfBirth && !/^\d{4}-\d{2}-\d{2}$/.test(dateOfBirth)) {
    return { success: false, error: 'Invalid date of birth' }
  }

  const { error } = await supabase
    .from('profiles')
    .update({
      ...(input.displayName !== undefined
        ? { display_name: displayName || null }
        : {}),
      first_name: firstName || null,
      last_name: lastName || null,
      bio: bio || null,
      country: country || null,
      date_of_birth: dateOfBirth || null,
      gender: input.gender || null,
      city: city || null,
      phone: phone || null,
      base_degree: input.baseDegree || null,
      base_university: baseUniversity || null,
      base_graduation_year: input.baseGraduationYear,
    })
    .eq('id', userData.user.id)

  if (error) {
    return { success: false, error: error.message }
  }

  return { success: true }
}


type HigherEducationInput = {
  university: string
  degree: 'higher_diploma' | 'master' | 'phd'
  yearObtained: number | null
}

type JobHistoryInput = {
  employer: string
  jobTitle: string
  startYear: number | null
  endYear: number | null
}

function validProfileYear(value: number | null) {
  if (value === null) return true
  const year = new Date().getFullYear()
  return Number.isInteger(value) && value >= 1900 && value <= year + 1
}

async function getProfileActionUser() {
  const supabase = await createClient()
  const { data, error } = await supabase.auth.getUser()
  return { supabase, user: error ? null : data.user }
}

export async function createHigherEducation(input: HigherEducationInput) {
  const { supabase, user } = await getProfileActionUser()
  if (!user) return { success: false, error: 'Not authenticated' }

  const university = input.university.trim()
  if (!university) return { success: false, error: 'University is required' }
  if (!['higher_diploma', 'master', 'phd'].includes(input.degree))
    return { success: false, error: 'Invalid education degree' }
  if (!validProfileYear(input.yearObtained))
    return { success: false, error: 'Invalid year obtained' }

  const { error } = await supabase.from('higher_education').insert({
    user_id: user.id,
    university,
    degree: input.degree,
    year_obtained: input.yearObtained,
    is_public: true,
  })

  return error
    ? { success: false, error: error.message }
    : { success: true }
}

export async function updateHigherEducation(id: string, input: HigherEducationInput) {
  const { supabase, user } = await getProfileActionUser()
  if (!user) return { success: false, error: 'Not authenticated' }

  const university = input.university.trim()
  if (!id.trim() || !university)
    return { success: false, error: 'Required education data is missing' }
  if (!['higher_diploma', 'master', 'phd'].includes(input.degree))
    return { success: false, error: 'Invalid education degree' }
  if (!validProfileYear(input.yearObtained))
    return { success: false, error: 'Invalid year obtained' }

  const { error } = await supabase
    .from('higher_education')
    .update({
      university,
      degree: input.degree,
      year_obtained: input.yearObtained,
      is_public: true,
    })
    .eq('id', id)
    .eq('user_id', user.id)

  return error
    ? { success: false, error: error.message }
    : { success: true }
}

export async function deleteHigherEducation(id: string) {
  const { supabase, user } = await getProfileActionUser()
  if (!user) return { success: false, error: 'Not authenticated' }

  const { error } = await supabase
    .from('higher_education')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  return error
    ? { success: false, error: error.message }
    : { success: true }
}

export async function createJobHistory(input: JobHistoryInput) {
  const { supabase, user } = await getProfileActionUser()
  if (!user) return { success: false, error: 'Not authenticated' }

  const employer = input.employer.trim()
  const jobTitle = input.jobTitle.trim()

  if (!employer || !jobTitle)
    return { success: false, error: 'Employer and job title are required' }
  if (!validProfileYear(input.startYear) || !validProfileYear(input.endYear))
    return { success: false, error: 'Invalid work year' }
  if (input.startYear !== null && input.endYear !== null && input.endYear < input.startYear)
    return { success: false, error: 'End year cannot be before start year' }

  const { error } = await supabase.from('job_history').insert({
    user_id: user.id,
    employer,
    job_title: jobTitle,
    start_year: input.startYear,
    end_year: input.endYear,
    is_public: true,
  })

  return error
    ? { success: false, error: error.message }
    : { success: true }
}

export async function updateJobHistory(id: string, input: JobHistoryInput) {
  const { supabase, user } = await getProfileActionUser()
  if (!user) return { success: false, error: 'Not authenticated' }

  const employer = input.employer.trim()
  const jobTitle = input.jobTitle.trim()

  if (!id.trim() || !employer || !jobTitle)
    return { success: false, error: 'Required work data is missing' }
  if (!validProfileYear(input.startYear) || !validProfileYear(input.endYear))
    return { success: false, error: 'Invalid work year' }
  if (input.startYear !== null && input.endYear !== null && input.endYear < input.startYear)
    return { success: false, error: 'End year cannot be before start year' }

  const { error } = await supabase
    .from('job_history')
    .update({
      employer,
      job_title: jobTitle,
      start_year: input.startYear,
      end_year: input.endYear,
      is_public: true,
    })
    .eq('id', id)
    .eq('user_id', user.id)

  return error
    ? { success: false, error: error.message }
    : { success: true }
}

export async function deleteJobHistory(id: string) {
  const { supabase, user } = await getProfileActionUser()
  if (!user) return { success: false, error: 'Not authenticated' }

  const { error } = await supabase
    .from('job_history')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  return error
    ? { success: false, error: error.message }
    : { success: true }
}

export async function updateProfileAvatar(
  mediaRef: string,
): Promise<{ success: true } | { success: false; error: string }> {
  const supabase = await createClient()
  const { data: userData, error: userError } = await supabase.auth.getUser()

  if (userError || !userData.user) {
    return { success: false, error: 'Not authenticated' }
  }

  const value = mediaRef.trim()

  if (!value) {
    return { success: false, error: 'Avatar is required' }
  }

  let parsed: { provider: string; path: string }

  try {
    parsed = parseMediaRef(value)
  } catch {
    return { success: false, error: 'Invalid avatar reference' }
  }

  if (parsed.provider !== 'imagekit' || !parsed.path.trim()) {
    return { success: false, error: 'Invalid avatar reference' }
  }

  const normalizedRef = makeMediaRef('imagekit', parsed.path)

  const { data: currentProfile, error: currentProfileError } = await supabase
    .from('profiles')
    .select('avatar_url')
    .eq('id', userData.user.id)
    .maybeSingle()

  if (currentProfileError) {
    return { success: false, error: currentProfileError.message }
  }

  const previousAvatarUrl = currentProfile?.avatar_url ?? null

  const { error } = await supabase
    .from('profiles')
    .update({ avatar_url: normalizedRef })
    .eq('id', userData.user.id)

  if (error) {
    return { success: false, error: error.message }
  }

  if (previousAvatarUrl && previousAvatarUrl !== normalizedRef) {
    try {
      const previous = parseMediaRef(previousAvatarUrl)

      if (previous.provider === 'imagekit' && previous.path.trim()) {
        await deleteImagekitFileByPath(previous.path)
      }
    } catch {
      // The new avatar is already saved successfully.
      // Keep the new avatar even if cleanup of the previous file fails.
    }
  }

  return { success: true }
}


export async function deleteProfileAvatar(): Promise<
  { success: true } | { success: false; error: string }
> {
  const supabase = await createClient()
  const { data: userData, error: userError } = await supabase.auth.getUser()

  if (userError || !userData.user) {
    return { success: false, error: 'Not authenticated' }
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('avatar_url')
    .eq('id', userData.user.id)
    .maybeSingle()

  if (profileError) {
    return { success: false, error: profileError.message }
  }

  if (!profile?.avatar_url) {
    return { success: true }
  }

  let parsed: { provider: string; path: string }

  try {
    parsed = parseMediaRef(profile.avatar_url)
  } catch {
    return { success: false, error: 'Invalid avatar reference' }
  }

  if (parsed.provider !== 'imagekit' || !parsed.path.trim()) {
    return { success: false, error: 'Invalid avatar reference' }
  }

  try {
    await deleteImagekitFileByPath(parsed.path)
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'Failed to delete the ImageKit file',
    }
  }

  const { error: updateError } = await supabase
    .from('profiles')
    .update({ avatar_url: null })
    .eq('id', userData.user.id)

  if (updateError) {
    return { success: false, error: updateError.message }
  }

  return { success: true }
}

type ProfileFieldKey =
  | 'display_name'
  | 'avatar_url'
  | 'bio'
  | 'country'
  | 'first_name'
  | 'last_name'
  | 'date_of_birth'
  | 'gender'
  | 'city'
  | 'phone'
  | 'base_degree'
  | 'base_university'
  | 'base_graduation_year'

export async function updateProfileVisibility(
  visibility: Partial<Record<ProfileFieldKey, boolean>>,
): Promise<{ success: true } | { success: false; error: string }> {
  const supabase = await createClient()
  const { data: userData, error: userError } = await supabase.auth.getUser()

  if (userError || !userData.user) {
    return { success: false, error: 'Not authenticated' }
  }

  const allowedKeys: ProfileFieldKey[] = [
    'display_name',
    'avatar_url',
    'bio',
    'country',
    'first_name',
    'last_name',
    'date_of_birth',
    'gender',
    'city',
    'phone',
    'base_degree',
    'base_university',
    'base_graduation_year',
  ]

  const rows = allowedKeys.map((field_key) => ({
    user_id: userData.user.id,
    field_key,
    is_public: visibility[field_key] !== false,
  }))

  const { error } = await supabase
    .from('profile_field_visibility')
    .upsert(rows, { onConflict: 'user_id,field_key' })

  if (error) {
    return { success: false, error: error.message }
  }

  return { success: true }
}
