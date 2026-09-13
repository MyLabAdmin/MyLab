'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from '@/i18n/navigation'

export async function login(formData: FormData) {
  const supabase = await createClient()

  const { error } = await supabase.auth.signInWithPassword({
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  })

  if (error) {
    redirect({ href: `/login?error=${encodeURIComponent(error.message)}`, locale: formData.get('locale') as string })
  }

  redirect({ href: '/', locale: formData.get('locale') as string })
}

export async function signup(formData: FormData) {
  const supabase = await createClient()

  const { error } = await supabase.auth.signUp({
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  })

  if (error) {
    redirect({ href: `/signup?error=${encodeURIComponent(error.message)}`, locale: formData.get('locale') as string })
  }

  redirect({ href: '/', locale: formData.get('locale') as string })
}
