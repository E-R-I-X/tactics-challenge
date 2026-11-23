import { useTacticsStore } from '../../store/tacticsStore'
import { Panel } from '../ui/Panel'

export function SetPieceDesigner() {
  const setPieces = useTacticsStore((s) => s.setup.setPieces)

  return (
    <Panel title="Set Pieces">
      {setPieces.length === 0 ? (
        <p className="text-sm text-[var(--muted)]">No routines yet.</p>
      ) : (
        <ul className="space-y-2">
          {setPieces.map((routine, i) => (
            <li
              key={`${routine.type}-${i}`}
              className="rounded border border-[var(--panel-border)] px-3 py-2 text-sm"
            >
              <span className="font-medium capitalize text-[var(--chalk)]">
                {routine.type}
              </span>
              <span className="block text-[var(--muted)]">
                {routine.delivery} → {routine.targetZone}
              </span>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  )
}
