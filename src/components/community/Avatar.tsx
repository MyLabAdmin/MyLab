export default function Avatar({ name, size = 'md', avatarUrl }: { name: string; size?: 'sm' | 'md' | 'lg' | 'xl'; avatarUrl?: string | null }) {
  const dimensions = size === 'sm' ? 'w-6 h-6 text-xs' : size === 'lg' ? 'w-14 h-14 text-lg' : size === 'xl' ? 'w-20 h-20 text-2xl' : 'w-8 h-8 text-sm'

  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt={name || ''}
        className={dimensions + ' rounded-full object-cover shrink-0'}
      />
    )
  }

  return (
    <div
      className={dimensions + ' rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-semibold shrink-0'}
    >
      {name?.[0]?.toUpperCase() ?? '—'}
    </div>
  )
}
