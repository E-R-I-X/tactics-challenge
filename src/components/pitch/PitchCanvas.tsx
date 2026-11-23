import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Arc, Circle, Layer, Line, Rect, Stage } from 'react-konva'
import { FORMATION_SLOTS } from '../../data/formations'
import { slotRole } from '../../data/pitchLayouts'
import { restDefenceSlotIds } from '../../data/restDefence'
import { abbreviateName, assignSquadToSlots } from '../../lib/playerSlots'
import { useChallengeStore } from '../../store/challengeStore'
import { useTacticsStore } from '../../store/tacticsStore'
import type { Formation, PossessionMode } from '../../types'
import { TacticOverlays } from './overlays/TacticOverlays'
import { PlayerToken } from './PlayerToken'

interface PitchCanvasProps {
  formation: Formation
  possessionMode: PossessionMode
  /** Active tactics tab — drives set-piece preview overlays. */
  activeTab?: string
  className?: string
}

/** FIFA pitch aspect: length 105 × width 68 → portrait top-down. */
const ASPECT = 68 / 105
const LINE = '#e8f0e9'
const PAD_RATIO = 0.035

export function PitchCanvas({
  formation,
  possessionMode,
  activeTab = 'formation',
  className = '',
}: PitchCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [size, setSize] = useState({ width: 480, height: 480 * ASPECT })
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const layouts = useTacticsStore((s) => s.layouts)
  const setup = useTacticsStore((s) => s.setup)
  const movePlayer = useTacticsStore((s) => s.movePlayer)
  const resetLayouts = useTacticsStore((s) => s.resetLayouts)
  const homeSquad = useChallengeStore((s) => s.challenge.homeSquad)

  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    const update = () => {
      const width = Math.max(260, el.clientWidth)
      setSize({ width, height: width * ASPECT })
    }

    update()
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const pad = size.width * PAD_RATIO
  const pitchW = size.width - pad * 2
  const pitchH = size.height - pad * 2

  const toScreen = useCallback(
    (nx: number, ny: number) => ({
      x: pad + nx * pitchW,
      y: pad + (1 - ny) * pitchH,
    }),
    [pad, pitchW, pitchH],
  )

  const toNormalized = useCallback(
    (sx: number, sy: number) => ({
      x: (sx - pad) / pitchW,
      y: 1 - (sy - pad) / pitchH,
    }),
    [pad, pitchW, pitchH],
  )

  const dragBoundFunc = useCallback(
    (pos: { x: number; y: number }) => ({
      x: Math.min(pad + pitchW, Math.max(pad, pos.x)),
      y: Math.min(pad + pitchH, Math.max(pad, pos.y)),
    }),
    [pad, pitchW, pitchH],
  )

  const layout = layouts[possessionMode]
  const slots = FORMATION_SLOTS[formation]
  const showSetPiecePreview = activeTab === 'setpieces'
  const restIds = useMemo(
    () => new Set(restDefenceSlotIds(formation, setup.restDefence)),
    [formation, setup.restDefence],
  )

  const cornerRoutine = setup.setPieces[0]
  const setPieceRoles = useMemo(() => {
    if (!showSetPiecePreview || !cornerRoutine) {
      return { blockers: new Set<string>(), runners: new Set<string>() }
    }
    const outfield = slots.filter((s) => s.id !== 'gk')
    const byHeight = [...outfield].sort((a, b) => b.y - a.y)
    const blockers = new Set<string>()
    const runners = new Set<string>()
    if (cornerRoutine.blockers) {
      byHeight.slice(0, 2).forEach((s) => blockers.add(s.id))
    }
    if (cornerRoutine.screeningRunners) {
      byHeight.slice(2, 4).forEach((s) => runners.add(s.id))
    }
    return { blockers, runners }
  }, [showSetPiecePreview, cornerRoutine, slots])

  const nameBySlot = useMemo(() => {
    const assigned = assignSquadToSlots(formation, homeSquad)
    const map = new Map<string, string>()
    for (const row of assigned) {
      map.set(row.slotId, abbreviateName(row.player.name))
    }
    return map
  }, [formation, homeSquad])

  const tokens = useMemo(
    () =>
      slots.map((slot) => {
        const pos = layout[slot.id] ?? { x: slot.x, y: slot.y }
        const screen = toScreen(pos.x, pos.y)
        let highlight: 'rest-defence' | 'blocker' | 'runner' | null = null
        if (showSetPiecePreview) {
          if (setPieceRoles.blockers.has(slot.id)) highlight = 'blocker'
          else if (setPieceRoles.runners.has(slot.id)) highlight = 'runner'
        } else if (possessionMode === 'in' && restIds.has(slot.id)) {
          highlight = 'rest-defence'
        }
        return {
          id: slot.id,
          label: slotRole(formation, slot.id),
          nameLabel: nameBySlot.get(slot.id),
          highlight,
          ...screen,
        }
      }),
    [
      slots,
      layout,
      formation,
      toScreen,
      showSetPiecePreview,
      setPieceRoles,
      possessionMode,
      restIds,
      nameBySlot,
    ],
  )

  const handleDragEnd = useCallback(
    (id: string, sx: number, sy: number) => {
      const clamped = dragBoundFunc({ x: sx, y: sy })
      movePlayer(id, toNormalized(clamped.x, clamped.y), possessionMode)
    },
    [dragBoundFunc, movePlayer, possessionMode, toNormalized],
  )

  const markings = useMemo(
    () => buildMarkings(pad, pitchW, pitchH),
    [pad, pitchW, pitchH],
  )

  const caption = showSetPiecePreview
    ? 'Set-piece routine preview · blockers & runners highlighted'
    : possessionMode === 'in'
      ? 'Rest-defence players highlighted · build-up side overlay'
      : 'Press line + armed trigger zones'

  return (
    <div className={`flex w-full flex-col gap-2 ${className}`}>
      <div
        ref={containerRef}
        className="relative w-full overflow-hidden rounded-lg border border-[var(--panel-border)]"
        style={{ aspectRatio: '105 / 68' }}
      >
        <Stage
          width={size.width}
          height={size.height}
          className="block max-w-full"
          onMouseDown={(e) => {
            if (e.target === e.target.getStage()) setSelectedId(null)
          }}
        >
          <Layer listening={false}>
            <Rect
              x={0}
              y={0}
              width={size.width}
              height={size.height}
              fillLinearGradientStartPoint={{ x: 0, y: 0 }}
              fillLinearGradientEndPoint={{ x: 0, y: size.height }}
              fillLinearGradientColorStops={[0, '#081f18', 0.45, '#0a2e24', 1, '#071a14']}
            />
            {Array.from({ length: 12 }, (_, i) => (
              <Rect
                key={`stripe-${i}`}
                x={pad}
                y={pad + (pitchH / 12) * i}
                width={pitchW}
                height={pitchH / 12}
                fill={i % 2 === 0 ? '#16724c' : '#126644'}
                opacity={0.92}
              />
            ))}
            {/* Subtle vertical vignette for depth */}
            <Rect
              x={pad}
              y={pad}
              width={pitchW}
              height={pitchH}
              fillLinearGradientStartPoint={{ x: 0, y: 0 }}
              fillLinearGradientEndPoint={{ x: pitchW, y: 0 }}
              fillLinearGradientColorStops={[
                0,
                'rgba(0,0,0,0.22)',
                0.5,
                'rgba(0,0,0,0)',
                1,
                'rgba(0,0,0,0.22)',
              ]}
            />
            {/* Phase wash — stronger In vs Out atmosphere */}
            <Rect
              x={pad}
              y={pad}
              width={pitchW}
              height={pitchH}
              fill={
                possessionMode === 'in'
                  ? 'rgba(200, 245, 66, 0.07)'
                  : 'rgba(240, 160, 96, 0.08)'
              }
            />
            {markings}
            <TacticOverlays
              pad={pad}
              pitchW={pitchW}
              pitchH={pitchH}
              possessionMode={possessionMode}
              pressIntensity={setup.pressIntensity}
              pressingTriggers={setup.pressingTriggers}
              restDefence={setup.restDefence}
              buildUpPattern={setup.buildUpPattern}
              tempo={setup.tempo}
              setPieces={setup.setPieces}
              showSetPiecePreview={showSetPiecePreview}
            />
          </Layer>

          <Layer>
            {tokens.map((token) => (
              <PlayerToken
                key={`${token.id}-${possessionMode}-${activeTab}`}
                id={token.id}
                x={token.x}
                y={token.y}
                label={token.label}
                nameLabel={token.nameLabel}
                mode={possessionMode}
                highlight={token.highlight}
                selected={selectedId === token.id}
                onSelect={setSelectedId}
                onDragEnd={handleDragEnd}
                dragBoundFunc={dragBoundFunc}
                draggable
              />
            ))}
          </Layer>
        </Stage>

        <div
          className={`pointer-events-none absolute left-3 top-3 rounded px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider ${
            showSetPiecePreview
              ? 'bg-black/55 text-[var(--accent)]'
              : possessionMode === 'in'
                ? 'bg-[var(--accent)] text-[var(--ink)]'
                : 'bg-[var(--warn)]/90 text-[var(--ink)]'
          }`}
        >
          {showSetPiecePreview
            ? 'Set pieces'
            : possessionMode === 'in'
              ? 'In possession'
              : 'Out of possession'}
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-[var(--muted)]">
        <p>{caption}</p>
        <button
          type="button"
          onClick={() => {
            resetLayouts()
            setSelectedId(null)
          }}
          className="rounded border border-[var(--panel-border)] px-2.5 py-1 text-[var(--chalk)] hover:border-[var(--accent)]/40"
        >
          Reset positions
        </button>
      </div>
    </div>
  )
}

function buildMarkings(pad: number, pitchW: number, pitchH: number) {
  const cx = pad + pitchW / 2
  const cy = pad + pitchH / 2
  const stroke = { stroke: LINE, strokeWidth: 1.5, opacity: 0.9 }
  const boxW = pitchW * 0.58
  const boxH = pitchH * 0.165
  const sixW = pitchW * 0.32
  const sixH = pitchH * 0.055
  const circleR = pitchW * 0.095
  const spotR = Math.max(2, pitchW * 0.008)
  const cornerR = pitchW * 0.025

  return (
    <>
      <Rect x={pad} y={pad} width={pitchW} height={pitchH} {...stroke} />
      <Line points={[pad, cy, pad + pitchW, cy]} {...stroke} />
      <Circle x={cx} y={cy} radius={circleR} {...stroke} />
      <Circle x={cx} y={cy} radius={spotR} fill={LINE} opacity={0.9} />

      <Rect x={cx - boxW / 2} y={pad} width={boxW} height={boxH} {...stroke} />
      <Rect x={cx - sixW / 2} y={pad} width={sixW} height={sixH} {...stroke} />
      <Circle
        x={cx}
        y={pad + pitchH * 0.11}
        radius={spotR}
        fill={LINE}
        opacity={0.9}
      />
      <Arc
        x={cx}
        y={pad + pitchH * 0.11}
        innerRadius={circleR}
        outerRadius={circleR}
        angle={180}
        rotation={0}
        {...stroke}
      />

      <Rect
        x={cx - boxW / 2}
        y={pad + pitchH - boxH}
        width={boxW}
        height={boxH}
        {...stroke}
      />
      <Rect
        x={cx - sixW / 2}
        y={pad + pitchH - sixH}
        width={sixW}
        height={sixH}
        {...stroke}
      />
      <Circle
        x={cx}
        y={pad + pitchH - pitchH * 0.11}
        radius={spotR}
        fill={LINE}
        opacity={0.9}
      />
      <Arc
        x={cx}
        y={pad + pitchH - pitchH * 0.11}
        innerRadius={circleR}
        outerRadius={circleR}
        angle={180}
        rotation={180}
        {...stroke}
      />

      <Arc
        x={pad}
        y={pad}
        innerRadius={cornerR}
        outerRadius={cornerR}
        angle={90}
        rotation={0}
        {...stroke}
      />
      <Arc
        x={pad + pitchW}
        y={pad}
        innerRadius={cornerR}
        outerRadius={cornerR}
        angle={90}
        rotation={90}
        {...stroke}
      />
      <Arc
        x={pad}
        y={pad + pitchH}
        innerRadius={cornerR}
        outerRadius={cornerR}
        angle={90}
        rotation={270}
        {...stroke}
      />
      <Arc
        x={pad + pitchW}
        y={pad + pitchH}
        innerRadius={cornerR}
        outerRadius={cornerR}
        angle={90}
        rotation={180}
        {...stroke}
      />
    </>
  )
}
