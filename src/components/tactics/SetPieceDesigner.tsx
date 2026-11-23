import { useTacticsStore } from '../../store/tacticsStore'
import type { SetPieceRoutine } from '../../types'
import { Panel } from '../ui/Panel'

const DELIVERIES: SetPieceRoutine['delivery'][] = [
  'in-swing',
  'out-swing',
  'short',
]

const ZONES = ['six-yard', 'near-post', 'far-post', 'penalty-spot', 'edge-of-box']

export function SetPieceDesigner() {
  const setup = useTacticsStore((s) => s.setup)
  const updateSetPiece = useTacticsStore((s) => s.updateSetPiece)
  const setPieces = setup.setPieces

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
                    updateSetPiece(i, {
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
                <span className="text-xs text-[var(--muted)]">Target zone</span>
                <select
                  value={routine.targetZone}
                  onChange={(e) =>
                    updateSetPiece(i, { targetZone: e.target.value })
                  }
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
              <div className="mt-3 flex flex-col gap-2">
                <label className="flex cursor-pointer items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={routine.blockers}
                    onChange={(e) =>
                      updateSetPiece(i, { blockers: e.target.checked })
                    }
                    className="accent-[var(--accent)]"
                  />
                  Blockers / screen on keeper
                </label>
                <label className="flex cursor-pointer items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={routine.screeningRunners}
                    onChange={(e) =>
                      updateSetPiece(i, { screeningRunners: e.target.checked })
                    }
                    className="accent-[var(--accent)]"
                  />
                  Screening runners
                </label>
              </div>
            </li>
          ))}
        </ul>
      )}
      <p className="mt-3 text-xs text-[var(--muted)]">
        In-swing into the six-yard box with blockers lifts set-piece xG ~1.4–1.6×
        in the sim. Routine preview shows on the pitch.
      </p>
    </Panel>
  )
}
