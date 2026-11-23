import { FORMATIONS } from '../../data/formations'
import { useTacticsStore } from '../../store/tacticsStore'
import type { Formation } from '../../types'
import { Panel } from '../ui/Panel'

const SHAPE_HINTS: Record<Formation, { inPossession: string; outOfPossession: string }> = {
  '4-3-3': { inPossession: '2-3-5', outOfPossession: '4-4-2 mid-block' },
  '4-2-3-1': { inPossession: '2-4-4', outOfPossession: '4-4-1-1 mid-block' },
  '3-4-3': { inPossession: '3-2-5', outOfPossession: '5-2-3 mid-block' },
  '4-4-2': { inPossession: '2-4-4', outOfPossession: '4-4-2 mid-block' },
  '3-5-2': { inPossession: '3-2-5', outOfPossession: '5-3-2 mid-block' },
  '5-3-2': { inPossession: '3-4-3', outOfPossession: '5-4-1 low block' },
}

export function FormationPanel() {
  const setup = useTacticsStore((s) => s.setup)
  const setFormation = useTacticsStore((s) => s.setFormation)

  return (
    <Panel title="Formation">
      <p className="mb-3 text-sm text-[var(--muted)]">
        Base shape for both possession phases. Tokens reset to the formation
        template when you switch.
      </p>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {FORMATIONS.map((formation) => {
          const active = setup.formation === formation
          return (
            <button
              key={formation}
              type="button"
              onClick={() => setFormation(formation)}
              className={`rounded border px-3 py-2.5 text-left transition ${
                active
                  ? 'border-[var(--accent)] bg-[var(--accent)]/15 text-[var(--chalk)]'
                  : 'border-[var(--panel-border)] text-[var(--muted)] hover:text-[var(--chalk)]'
              }`}
            >
              <span className="block font-semibold tabular-nums">{formation}</span>
              <span className="mt-0.5 block text-[10px] uppercase tracking-wide opacity-80">
                {SHAPE_HINTS[formation].inPossession}
              </span>
            </button>
          )
        })}
      </div>
      <dl className="mt-4 grid gap-2 text-xs text-[var(--muted)]">
        <div className="flex justify-between gap-2 border-t border-[var(--panel-border)] pt-3">
          <dt>In possession</dt>
          <dd className="text-[var(--chalk)]">{setup.inPossessionShape}</dd>
        </div>
        <div className="flex justify-between gap-2">
          <dt>Out of possession</dt>
          <dd className="text-[var(--chalk)]">{setup.outOfPossessionShape}</dd>
        </div>
      </dl>
    </Panel>
  )
}
