// نقطة التحكم الوحيدة في خدمة تخزين الصور النشطة.
// لإضافة/استبدال خدمة مستقبلاً (Bunny, Cloudflare R2...):
// 1. أضف route جديد في /api/upload-auth/<provider>
// 2. أضف حالة جديدة في ImageUpload.tsx
// 3. غيّر القيمة هنا بس
export const ACTIVE_MEDIA_PROVIDER = 'imagekit' as const
