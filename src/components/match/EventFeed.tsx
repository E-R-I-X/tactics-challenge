import type { MatchEvent } from '../../types'

interface EventFeedProps {
  events: MatchEvent[]
  highlightMinute?: number
}

export function EventFeed({ events, highlightMinute }: EventFeedProps) {
  return (
    <ol className="max-h-80 space-y-2 overflow-y-auto pr-1">
      {events.map((event, i) => {
        const active =
          highlightMinute !== undefined && event.minute <= highlightMinute
        return (
          <li
            key={`${event.minute}-${event.type}-${i}`}
            className={`rounded border px-3 py-2 text-sm transition ${
              active
                ? 'border-[var(--accent)]/40 bg-[var(--accent)]/5 text-[var(--chalk)]'
                : 'border-transparent text-[var(--muted)] opacity-50'
            }`}
          >
            <span className="mr-2 font-semibold tabular-nums text-[var(--accent)]">
              {event.minute}'
            </span>
            {event.description}
            {event.xG !== undefined && (
              <span className="ml-2 text-xs text-[var(--muted)]">
                xG {event.xG.toFixed(2)}
              </span>
            )}
          </li>
        )
      })}
    </ol>
  )
}
