export const STAFF_ROLES = [
  'super_admin',
  'knowledge_manager',
  'course_author',
  'course_reviewer',
  'community_moderator',
  'finance_economy_manager',
  'support_staff',
] as const

export type StaffRole = (typeof STAFF_ROLES)[number]

export type AuthorizationContext = {
  userId: string
  isActive: boolean
}
