import { useTacticsStore } from '../../store/tacticsStore'
import type { SetPieceRoutine } from '../../types'
import { Panel } from '../ui/Panel'

const DELIVERIES: SetPieceRoutine['delivery'][] = [
  'in-swing',
  'out-swing',
  'short',
]

const ZONES = ['six-yard', 'near-post', 'far-post', 'edge-of-box']

export function SetPieceDesigner() {
  const setup = useTacticsStore((s) => s.setup)
  const applyPreset = useTacticsStore((s) => s.applyPreset)
  const setPieces = setup.setPieces

  const updateRoutine = (index: number, patch: Partial<SetPieceRoutine>) => {
    const next = setPieces.map((r, i) => (i === index ? { ...r, ...patch } : r))
    applyPreset({ ...setup, setPieces: next })
  }

  return (
    <Panel title="Set Pieces">
      {setPieces.length === 0 ? (
        <p className="text-sm text-[var(--muted)]">No routines yet.</p>
      ) : (
        <ul className="space-y-3">
          {setPieces.map((routine, i) => (
            <li
              key={`${routine.type}-${i}`}
              className="rounded border border-[var(--panel-border)] px-3 py-3 text-sm"
            >
              <span className="font-medium capitalize text-[var(--chalk)]">
                {routine.type}
              </span>
              <label className="mt-2 flex flex-col gap-1">
                <span className="text-xs text-[var(--muted)]">Delivery</span>
                <select
                  value={routine.delivery}
                  onChange={(e) =>
                    updateRoutine(i, {
                      delivery: e.target.value as SetPieceRoutine['delivery'],
                    })
                  }
                  className="rounded border border-[var(--panel-border)] bg-black/40 px-2 py-1.5 text-[var(--chalk)]"
                >
                  {DELIVERIES.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </label>
              <label className="mt-2 flex flex-col gap-1">
                <span className="text-xs text-[var(--muted)]">Target</span>
                <select
                  value={routine.targetZone}
                  onChange={(e) => updateRoutine(i, { targetZone: e.target.value })}
                  className="rounded border border-[var(--panel-border)] bg-black/40 px-2 py-1.5 text-[var(--chalk)]"
                >
                  {ZONES.map((z) => (
                    <option key={z} value={z}>
                      {z}
                    </option>
                  ))}
                  {!ZONES.includes(routine.targetZone) && (
                    <option value={routine.targetZone}>{routine.targetZone}</option>
                  )}
                </select>
              </label>
            </li>
          ))}
        </ul>
      )}
      <p className="mt-3 text-xs text-[var(--muted)]">
        In-swing into the six-yard box raises set-piece xG in the sim.
      </p>
    </Panel>
  )
}
