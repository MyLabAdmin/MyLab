'use server'

import { makeMediaRef, parseMediaRef } from '@/lib/storage'
import { createClient } from '@/lib/supabase/server'

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

  const { error } = await supabase
    .from('profiles')
    .update({ avatar_url: normalizedRef })
    .eq('id', userData.user.id)

  if (error) {
    return { success: false, error: error.message }
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
