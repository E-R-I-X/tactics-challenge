import { TACTIC_PRESETS } from '../../data/presets'
import { useTacticsStore } from '../../store/tacticsStore'
import { Panel } from '../ui/Panel'

export function PresetsPanel() {
  const applyPreset = useTacticsStore((s) => s.applyPreset)
  const formation = useTacticsStore((s) => s.setup.formation)
  const pressIntensity = useTacticsStore((s) => s.setup.pressIntensity)

  return (
    <Panel title="Presets">
      <div className="flex flex-col gap-2">
        {TACTIC_PRESETS.map((preset) => (
          <button
            key={preset.id}
            type="button"
            onClick={() => applyPreset(preset.setup)}
            className="rounded border border-[var(--panel-border)] px-3 py-2 text-left transition hover:border-[var(--accent)]/50 hover:bg-white/5"
          >
            <span className="block font-medium text-[var(--chalk)]">
              {preset.name}
            </span>
            <span className="text-xs text-[var(--muted)]">
              {preset.setup.formation} · {preset.setup.pressIntensity} press
            </span>
          </button>
        ))}
      </div>
      <p className="mt-3 text-xs text-[var(--muted)]">
        Active: {formation} / {pressIntensity}
      </p>
    </Panel>
  )
}
