import type { ReactNode } from 'react'

interface PanelProps {
  title: string
  children: ReactNode
  className?: string
}

export function Panel({ title, children, className = '' }: PanelProps) {
  return (
    <section
      className={`rounded-lg border border-[var(--panel-border)] bg-[var(--panel)]/90 p-4 ${className}`}
    >
      <h3 className="mb-3 text-lg text-[var(--accent)]">{title}</h3>
      {children}
    </section>
  )
}
