import { PRESSING_TRIGGERS } from '../../data/pressingTriggers'
import { useTacticsStore } from '../../store/tacticsStore'
import type { PressIntensity, PressingTriggerId } from '../../types'
import { Panel } from '../ui/Panel'
import { SegmentedControl } from '../ui/SegmentedControl'

const INTENSITIES: { value: PressIntensity; label: string }[] = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Med' },
  { value: 'high', label: 'High' },
  { value: 'very-high', label: 'Max' },
]

export function PressingPanel() {
  const setup = useTacticsStore((s) => s.setup)
  const setPressIntensity = useTacticsStore((s) => s.setPressIntensity)
  const setCounterPress = useTacticsStore((s) => s.setCounterPress)
  const togglePressingTrigger = useTacticsStore((s) => s.togglePressingTrigger)

  return (
    <Panel title="Pressing">
      <div className="mb-3">
        <p className="mb-2 text-xs uppercase tracking-wide text-[var(--muted)]">
          Intensity
        </p>
        <SegmentedControl
          ariaLabel="Press intensity"
          options={INTENSITIES}
          value={setup.pressIntensity}
          onChange={setPressIntensity}
        />
      </div>

      <label className="mb-3 flex cursor-pointer items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={setup.counterPress}
          onChange={(e) => setCounterPress(e.target.checked)}
          className="accent-[var(--accent)]"
        />
        Counter-press after loss
      </label>

      <p className="mb-2 text-xs uppercase tracking-wide text-[var(--muted)]">
        Triggers
      </p>
      <p className="mb-2 text-xs text-[var(--muted)]">
        Sim only awards a strong press bonus when the live situation matches a
        selected trigger.
      </p>
      <div className="flex flex-wrap gap-2">
        {PRESSING_TRIGGERS.map((trigger) => {
          const on = setup.pressingTriggers.includes(trigger.id)
          return (
            <button
              key={trigger.id}
              type="button"
              onClick={() =>
                togglePressingTrigger(trigger.id as PressingTriggerId)
              }
              className={`rounded border px-2 py-1 text-xs transition ${
                on
                  ? 'border-[var(--accent)] bg-[var(--accent)]/15 text-[var(--accent)]'
                  : 'border-[var(--panel-border)] text-[var(--muted)]'
              }`}
            >
              {trigger.label}
            </button>
          )
        })}
      </div>
    </Panel>
  )
}
