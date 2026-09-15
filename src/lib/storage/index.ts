// طبقة تجريد لخدمات تخزين الصور. أي مرجع صورة مخزّن بصيغة "provider:path"
// عشان نقدر نضيف خدمات جديدة (Bunny, Cloudflare R2...) بدون تعديل باقي الكود.

export function makeMediaRef(provider: string, path: string): string {
  return `${provider}:${path}`
}

export function parseMediaRef(ref: string): { provider: string; path: string } {
  const idx = ref.indexOf(':')
  return { provider: ref.slice(0, idx), path: ref.slice(idx + 1) }
}
