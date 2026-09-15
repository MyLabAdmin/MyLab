'use server'

import { createClient } from '@/lib/supabase/server'
import { getImagekitSignedUrl } from '@/lib/storage/imagekit-server'
import { makeMediaRef } from '@/lib/storage'

export async function saveToMediaLibrary(path: string, name: string, tags: string[], scope: string) {
  const supabase = await createClient()
  const { data: userData } = await supabase.auth.getUser()
  if (!userData.user) return { success: false }

  const { error } = await supabase.from('media_library').insert({
    provider: 'imagekit',
    path,
    name,
    tags,
    scope,
    uploaded_by: userData.user.id,
  })

  return { success: !error }
}

export async function searchMediaLibrary(query: string, scope: string) {
  const supabase = await createClient()
  let dbQuery = supabase
    .from('media_library')
    .select('id, path, name, tags')
    .eq('scope', scope)
    .order('created_at', { ascending: false })
    .limit(30)

  if (query) {
    dbQuery = dbQuery.or(`name.ilike.%${query}%,tags.cs.{${query}}`)
  }

  const { data } = await dbQuery
  if (!data) return []

  return Promise.all(
    data.map(async (item) => ({
      id: item.id,
      name: item.name,
      ref: makeMediaRef('imagekit', item.path),
      previewUrl: getImagekitSignedUrl(item.path),
    }))
  )
}
