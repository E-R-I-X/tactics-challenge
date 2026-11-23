import { FORMATION_SLOTS } from '../../data/formations'
import { useTacticsStore } from '../../store/tacticsStore'
import { Panel } from '../ui/Panel'

export function RolesPanel() {
  const formation = useTacticsStore((s) => s.setup.formation)
  const slots = FORMATION_SLOTS[formation]

  return (
    <Panel title="Roles">
      <ul className="grid grid-cols-2 gap-2 text-sm">
        {slots.map((slot) => (
          <li
            key={slot.id}
            className="rounded border border-[var(--panel-border)] px-2 py-1.5 text-[var(--muted)]"
          >
            <span className="font-semibold text-[var(--chalk)]">{slot.role}</span>
          </li>
        ))}
      </ul>
    </Panel>
  )
}
