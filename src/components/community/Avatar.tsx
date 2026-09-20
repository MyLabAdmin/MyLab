export default function Avatar({ name, size = 'md' }: { name: string; size?: 'sm' | 'md' }) {
  const dimensions = size === 'sm' ? 'w-6 h-6 text-xs' : 'w-8 h-8 text-sm'
  return (
    <div className={`${dimensions} rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-semibold shrink-0`}>
      {name?.[0]?.toUpperCase() ?? '—'}
    </div>
  )
}
