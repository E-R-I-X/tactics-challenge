import { useTacticsStore } from '../../store/tacticsStore'
import type { RestDefenceStructure } from '../../types'
import { Panel } from '../ui/Panel'
import { SegmentedControl } from '../ui/SegmentedControl'

const STRUCTURES: { value: RestDefenceStructure; label: string }[] = [
  { value: '3-2', label: '3-2' },
  { value: '2-3', label: '2-3' },
  { value: '3-1', label: '3-1' },
  { value: '2-2', label: '2-2' },
]

export function RestDefencePanel() {
  const restDefence = useTacticsStore((s) => s.setup.restDefence)
  const setRestDefence = useTacticsStore((s) => s.setRestDefence)

  return (
    <Panel title="Rest Defence">
      <p className="mb-3 text-sm text-[var(--muted)]">
        Structure left behind when you attack.
      </p>
      <SegmentedControl
        ariaLabel="Rest defence structure"
        options={STRUCTURES}
        value={restDefence}
        onChange={setRestDefence}
      />
    </Panel>
  )
}
