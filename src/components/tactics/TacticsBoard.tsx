import { useState } from 'react'
import { useChallengeStore } from '../../store/challengeStore'
import { useMatchStore } from '../../store/matchStore'
import { useTacticsStore } from '../../store/tacticsStore'
import { PitchCanvas } from '../pitch/PitchCanvas'
import { ModeBadge } from '../ui/ModeBadge'
import { SegmentedControl } from '../ui/SegmentedControl'
import { BuildUpPanel } from './BuildUpPanel'
import { FormationPanel } from './FormationPanel'
import { PresetsPanel } from './PresetsPanel'
import { PressingPanel } from './PressingPanel'
import { RestDefencePanel } from './RestDefencePanel'
import { RolesPanel } from './RolesPanel'
import { SetPieceDesigner } from './SetPieceDesigner'

const TABS = [
  { id: 'presets', label: 'Presets' },
  { id: 'formation', label: 'Formation' },
  { id: 'pressing', label: 'Pressing' },
  { id: 'rest', label: 'Rest Defence' },
  { id: 'buildup', label: 'Build-Up' },
  { id: 'roles', label: 'Roles' },
  { id: 'setpieces', label: 'Set Pieces' },
] as const

type TabId = (typeof TABS)[number]['id']

export function TacticsBoard() {
  const challenge = useChallengeStore((s) => s.challenge)
  const setPhase = useChallengeStore((s) => s.setPhase)
  const setup = useTacticsStore((s) => s.setup)
  const possessionMode = useTacticsStore((s) => s.possessionMode)
  const setPossessionMode = useTacticsStore((s) => s.setPossessionMode)
  const runSimulation = useMatchStore((s) => s.runSimulation)
  const [activeTab, setActiveTab] = useState<TabId>('formation')

  const mode = useChallengeStore((s) => s.mode)

  const startMatch = () => {
    runSimulation(
      setup,
      challenge.homeSquad,
      challenge.awaySquad,
      challenge.homeBench,
    )
    setPhase('match')
  }

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="mb-2">
            <ModeBadge mode={mode} size="sm" />
          </div>
          <p className="text-sm text-[var(--muted)]">{challenge.fixture}</p>
          <h1 className="text-4xl text-[var(--chalk)] md:text-5xl">
            Tactics Board
          </h1>
          <p className="mt-1 text-sm text-[var(--muted)]">
            {mode === 'practice'
              ? 'Unlimited runs · reset anytime'
              : 'One official attempt · locked squad'}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setPhase('lobby')}
            className="rounded border border-[var(--panel-border)] px-4 py-2 text-sm text-[var(--muted)] hover:text-[var(--chalk)]"
          >
            Back
          </button>
          <button
            type="button"
            onClick={startMatch}
            className="rounded bg-[var(--accent)] px-5 py-2 text-sm font-semibold text-[var(--ink)] transition hover:brightness-110"
          >
            Start Match
          </button>
        </div>
      </header>

      <div className="flex flex-wrap items-center gap-4">
        <SegmentedControl
          ariaLabel="Possession phase"
          options={[
            { value: 'in', label: 'In Possession' },
            { value: 'out', label: 'Out of Possession' },
          ]}
          value={possessionMode}
          onChange={setPossessionMode}
        />
        <p className="text-sm text-[var(--muted)]">
          {setup.formation}
          {' · '}
          {possessionMode === 'in'
            ? setup.inPossessionShape
            : setup.outOfPossessionShape}
          {' · '}
          {setup.pressIntensity} press
          {' · '}
          rest {setup.restDefence}
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.25fr)_minmax(300px,0.75fr)]">
        <div className="flex w-full min-w-0 flex-col gap-3">
          <PitchCanvas
            formation={setup.formation}
            possessionMode={possessionMode}
            activeTab={activeTab}
          />
          <p className="text-sm text-[var(--muted)]">
            {activeTab === 'setpieces'
              ? 'Set Pieces tab · delivery arc, target, blockers & runners'
              : possessionMode === 'in'
                ? 'In possession · rest-defence players + build-up side'
                : 'Out of possession · press line + trigger zones'}
          </p>
        </div>

        <div className="flex min-h-0 flex-col gap-3">
          <div
            role="tablist"
            aria-label="Tactics controls"
            className="flex flex-wrap gap-1 rounded-md bg-black/30 p-1"
          >
            {TABS.map((tab) => {
              const active = activeTab === tab.id
              return (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => setActiveTab(tab.id)}
                  className={`rounded px-2.5 py-1.5 text-xs transition sm:text-sm ${
                    active
                      ? 'bg-[var(--accent)] font-semibold text-[var(--ink)]'
                      : 'text-[var(--muted)] hover:text-[var(--chalk)]'
                  }`}
                >
                  {tab.label}
                </button>
              )
            })}
          </div>

          <div role="tabpanel" className="min-h-[280px]">
            {activeTab === 'presets' && <PresetsPanel />}
            {activeTab === 'formation' && <FormationPanel />}
            {activeTab === 'pressing' && <PressingPanel />}
            {activeTab === 'rest' && <RestDefencePanel />}
            {activeTab === 'buildup' && <BuildUpPanel />}
            {activeTab === 'roles' && <RolesPanel />}
            {activeTab === 'setpieces' && <SetPieceDesigner />}
          </div>
        </div>
      </div>
    </div>
  )
}
