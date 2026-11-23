import type { Player } from '../../types'
import { Panel } from '../ui/Panel'

interface SquadOverviewProps {
  title: string
  players: Player[]
}

export function SquadOverview({ title, players }: SquadOverviewProps) {
  return (
    <Panel title={title}>
      <ul className="space-y-1.5">
        {players.map((player) => (
          <li
            key={player.id}
            className="flex items-center justify-between gap-2 text-sm"
          >
            <span className="text-[var(--chalk)]">{player.name}</span>
            <span className="text-xs uppercase tracking-wide text-[var(--muted)]">
              {player.position}
            </span>
          </li>
        ))}
      </ul>
    </Panel>
  )
}
