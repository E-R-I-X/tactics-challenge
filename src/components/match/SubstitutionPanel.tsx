import { useMemo, useState } from 'react'
import { useChallengeStore } from '../../store/challengeStore'
import { MAX_SUBS, useMatchStore } from '../../store/matchStore'
import { Panel } from '../ui/Panel'

export function SubstitutionPanel() {
  const challenge = useChallengeStore((s) => s.challenge)
  const minute = useMatchStore((s) => s.minute)
  const paused = useMatchStore((s) => s.paused)
  const subsUsed = useMatchStore((s) => s.subsUsed)
  const onPitchIds = useMatchStore((s) => s.onPitchIds)
  const benchIds = useMatchStore((s) => s.benchIds)
  const makeSubstitution = useMatchStore((s) => s.makeSubstitution)
  const setPaused = useMatchStore((s) => s.setPaused)

  const [outId, setOutId] = useState('')
  const [inId, setInId] = useState('')

  const roster = useMemo(() => {
    const map = new Map(
      [...challenge.homeSquad, ...challenge.homeBench].map((p) => [p.id, p]),
    )
    return map
  }, [challenge.homeSquad, challenge.homeBench])

  const remaining = MAX_SUBS - subsUsed
  const canSub = remaining > 0 && minute < 90

  const apply = () => {
    if (!outId || !inId) return
    const outName = roster.get(outId)?.name ?? outId
    const inName = roster.get(inId)?.name ?? inId
    const ok = makeSubstitution(
      outId,
      inId,
      Math.max(1, minute),
      `Substitution — ${inName} on for ${outName}`,
    )
    if (ok) {
      setOutId('')
      setInId('')
      if (!paused) setPaused(true)
    }
  }

  return (
    <Panel title="Substitutions">
      <p className="mb-3 text-sm text-[var(--muted)]">
        {subsUsed}/{MAX_SUBS} used · {remaining} left
      </p>
      {!canSub ? (
        <p className="text-sm text-[var(--muted)]">
          {remaining <= 0
            ? 'No substitutions remaining.'
            : 'Subs close at full time.'}
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-[var(--muted)]">Off</span>
            <select
              value={outId}
              onChange={(e) => setOutId(e.target.value)}
              className="rounded border border-[var(--panel-border)] bg-black/40 px-2 py-2 text-[var(--chalk)]"
            >
              <option value="">Select player</option>
              {onPitchIds.map((id) => {
                const p = roster.get(id)
                if (!p || p.position === 'GK') return null
                return (
                  <option key={id} value={id}>
                    {p.name} ({p.position})
                  </option>
                )
              })}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-[var(--muted)]">On</span>
            <select
              value={inId}
              onChange={(e) => setInId(e.target.value)}
              className="rounded border border-[var(--panel-border)] bg-black/40 px-2 py-2 text-[var(--chalk)]"
            >
              <option value="">Select bench</option>
              {benchIds.map((id) => {
                const p = roster.get(id)
                if (!p || p.position === 'GK') return null
                return (
                  <option key={id} value={id}>
                    {p.name} ({p.position})
                  </option>
                )
              })}
            </select>
          </label>
          <button
            type="button"
            disabled={!outId || !inId}
            onClick={apply}
            className="rounded bg-[var(--accent)] px-3 py-2 text-sm font-semibold text-[var(--ink)] disabled:opacity-40"
          >
            Make sub
          </button>
          <p className="text-xs text-[var(--muted)]">
            Match pauses when you sub so you can review the board.
          </p>
        </div>
      )}
    </Panel>
  )
}
