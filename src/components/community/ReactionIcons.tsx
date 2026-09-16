type IconProps = { className?: string }

export function HelpfulIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path
        d="M7 11v9H4a1 1 0 0 1-1-1v-7a1 1 0 0 1 1-1h3zm0 0 4.5-8a2 2 0 0 1 2 2.2L12.8 9H18a2 2 0 0 1 2 2.4l-1.4 7A2 2 0 0 1 16.6 20H10a3 3 0 0 1-3-3v-6z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function InsightfulIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path
        d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3.6 10.8c.6.45 1 1.15 1.1 1.9L9.6 17h4.8l.1-1.3c.1-.75.5-1.45 1.1-1.9A6 6 0 0 0 12 3z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function WellDoneIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path
        d="m12 3 1.9 4.2L18 8l-3 3.3.7 4.5L12 13.8 8.3 15.8 9 11.3 6 8l4.1-.8L12 3z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path d="M6 15v6M9 15v6M3 18h3M6 18h3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  )
}

export function LoveIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path
        d="M12 20.5s-7.5-4.6-9.5-9A5 5 0 0 1 12 6.5 5 5 0 0 1 21.5 11.5c-2 4.4-9.5 9-9.5 9z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function SurprisingIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth="1.6" />
      <path d="M12 8v5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <circle cx="12" cy="16" r="1" fill="currentColor" />
    </svg>
  )
}

export function ReactionCircleIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <circle cx="12" cy="12" r="9" fill="currentColor" />
    </svg>
  )
}

export const REACTIONS = [
  { key: 'helpful', Icon: HelpfulIcon, labelEn: 'Helpful', labelAr: 'مفيد' },
  { key: 'insightful', Icon: InsightfulIcon, labelEn: 'Insightful', labelAr: 'ملهم' },
  { key: 'well_done', Icon: WellDoneIcon, labelEn: 'Well Done', labelAr: 'برافو' },
  { key: 'love', Icon: LoveIcon, labelEn: 'Love', labelAr: 'أحببته' },
  { key: 'surprising', Icon: SurprisingIcon, labelEn: 'Surprising', labelAr: 'مثير' },
] as const

export type ReactionKey = typeof REACTIONS[number]['key']
