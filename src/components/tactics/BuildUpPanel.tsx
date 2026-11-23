import { useTacticsStore } from '../../store/tacticsStore'
import type { Tempo } from '../../types'
import { Panel } from '../ui/Panel'
import { SegmentedControl } from '../ui/SegmentedControl'

const TEMPOS: { value: Tempo; label: string }[] = [
  { value: 'slow', label: 'Slow' },
  { value: 'balanced', label: 'Balanced' },
  { value: 'high', label: 'High' },
]

const PATTERNS = [
  { id: 'short-from-back', label: 'Short from back' },
  { id: 'patient-circulation', label: 'Patient circulation' },
  { id: 'direct-into-channels', label: 'Direct channels' },
]

export function BuildUpPanel() {
  const setup = useTacticsStore((s) => s.setup)
  const setTempo = useTacticsStore((s) => s.setTempo)
  const setBuildUpPattern = useTacticsStore((s) => s.setBuildUpPattern)

  return (
    <Panel title="Build-Up">
      <p className="mb-2 text-xs uppercase tracking-wide text-[var(--muted)]">
        Tempo
      </p>
      <div className="mb-4">
        <SegmentedControl
          ariaLabel="Tempo"
          options={TEMPOS}
          value={setup.tempo}
          onChange={setTempo}
        />
      </div>
      <p className="mb-2 text-xs uppercase tracking-wide text-[var(--muted)]">
        Pattern
      </p>
      <div className="flex flex-col gap-2">
        {PATTERNS.map((pattern) => {
          const on = setup.buildUpPattern === pattern.id
          return (
            <button
              key={pattern.id}
              type="button"
              onClick={() => setBuildUpPattern(pattern.id)}
              className={`rounded border px-3 py-2 text-left text-sm transition ${
                on
                  ? 'border-[var(--accent)] bg-[var(--accent)]/10 text-[var(--chalk)]'
                  : 'border-[var(--panel-border)] text-[var(--muted)] hover:text-[var(--chalk)]'
              }`}
            >
              {pattern.label}
            </button>
          )
        })}
      </div>
    </Panel>
  )
}
