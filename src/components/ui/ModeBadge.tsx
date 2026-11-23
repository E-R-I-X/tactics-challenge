import type { ChallengeMode } from '../../types'

interface ModeBadgeProps {
  mode: ChallengeMode
  size?: 'sm' | 'md'
  className?: string
}

export function ModeBadge({ mode, size = 'md', className = '' }: ModeBadgeProps) {
  const isOfficial = mode === 'official'
  const pad = size === 'sm' ? 'px-2.5 py-0.5 text-[10px]' : 'px-3 py-1 text-xs'

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-sm font-semibold uppercase tracking-[0.14em] ${pad} ${
        isOfficial
          ? 'bg-[var(--accent)] text-[var(--ink)]'
          : 'border border-[var(--panel-border)] bg-black/35 text-[var(--chalk)]'
      } ${className}`}
    >
      <span
        className={`inline-block h-1.5 w-1.5 rounded-full ${
          isOfficial ? 'bg-[var(--ink)]' : 'bg-[var(--warn)]'
        }`}
        aria-hidden
      />
      {isOfficial ? 'Daily Challenge' : 'Practice Mode'}
    </span>
  )
}
