import { Arrow, Circle, Group, Line, Rect, Text } from 'react-konva'
import { PRESSING_TRIGGERS } from '../../../data/pressingTriggers'
import type {
  PossessionMode,
  PressIntensity,
  PressingTriggerId,
  RestDefenceStructure,
  SetPieceRoutine,
  Tempo,
} from '../../../types'

interface TacticOverlaysProps {
  pad: number
  pitchW: number
  pitchH: number
  possessionMode: PossessionMode
  pressIntensity: PressIntensity
  pressingTriggers: PressingTriggerId[]
  restDefence: RestDefenceStructure
  buildUpPattern: string
  tempo: Tempo
  setPieces: SetPieceRoutine[]
  /** When true (Set Pieces tab), show routine preview on the pitch. */
  showSetPiecePreview: boolean
}

const PRESS_Y: Record<PressIntensity, number> = {
  low: 0.38,
  medium: 0.52,
  high: 0.68,
  'very-high': 0.78,
}

function patternLabel(buildUpPattern: string): string {
  switch (buildUpPattern) {
    case 'direct-into-channels':
      return 'Direct channels'
    case 'patient-circulation':
      return 'Patient circulation'
    case 'dropping-six':
      return 'Dropping midfielder'
    case 'overload-left':
      return 'Overload left'
    case 'overload-right':
      return 'Overload right'
    case 'inverted-fullbacks':
      return 'Inverted full-backs'
    default:
      return 'Short from back'
  }
}

function targetZonePoint(zone: string): { x: number; y: number } {
  const z = zone.toLowerCase()
  if (z.includes('six') || z === 'near-post') return { x: 0.5, y: 0.94 }
  if (z.includes('far')) return { x: 0.62, y: 0.88 }
  if (z.includes('edge')) return { x: 0.5, y: 0.78 }
  if (z.includes('penalty')) return { x: 0.5, y: 0.86 }
  return { x: 0.5, y: 0.9 }
}

export function TacticOverlays({
  pad,
  pitchW,
  pitchH,
  possessionMode,
  pressIntensity,
  pressingTriggers,
  restDefence,
  buildUpPattern,
  tempo,
  setPieces,
  showSetPiecePreview,
}: TacticOverlaysProps) {
  const ny = (n: number) => pad + (1 - n) * pitchH
  const nx = (n: number) => pad + n * pitchW

  if (showSetPiecePreview) {
    return (
      <SetPiecePreview
        pad={pad}
        pitchW={pitchW}
        pitchH={pitchH}
        nx={nx}
        ny={ny}
        routine={setPieces[0]}
      />
    )
  }

  if (possessionMode === 'out') {
    const lineY = ny(PRESS_Y[pressIntensity])
    return (
      <Group listening={false}>
        <Rect
          x={pad}
          y={pad}
          width={pitchW}
          height={lineY - pad}
          fill="#c8f542"
          opacity={0.06 + PRESS_Y[pressIntensity] * 0.08}
        />
        <Line
          points={[pad + 4, lineY, pad + pitchW - 4, lineY]}
          stroke="#c8f542"
          strokeWidth={2}
          dash={[8, 6]}
          opacity={0.85}
        />
        <Text
          x={pad + 8}
          y={lineY + 6}
          text={`Press line · ${pressIntensity}`}
          fontSize={11}
          fontFamily="DM Sans"
          fill="#c8f542"
          opacity={0.9}
        />
        <PressTriggerZones
          pad={pad}
          pitchW={pitchW}
          pitchH={pitchH}
          nx={nx}
          ny={ny}
          triggers={pressingTriggers}
        />
      </Group>
    )
  }

  // In possession: rest-defence band labels + preferred build-up side
  const [back, mid] = restDefence.split('-').map(Number) as [number, number]
  const arrowOpacity = tempo === 'high' ? 0.9 : tempo === 'slow' ? 0.45 : 0.7
  const side =
    buildUpPattern === 'overload-left' || buildUpPattern === 'inverted-fullbacks'
      ? 'left'
      : buildUpPattern === 'overload-right'
        ? 'right'
        : 'centre'

  return (
    <Group listening={false}>
      <Rect
        x={pad + pitchW * 0.08}
        y={ny(0.4)}
        width={pitchW * 0.84}
        height={ny(0.1) - ny(0.4)}
        fill="#f0a060"
        opacity={0.07}
        cornerRadius={4}
      />
      <Text
        x={pad + 8}
        y={ny(0.42)}
        text={`Rest defence ${restDefence} · ${back}+${mid} highlighted`}
        fontSize={11}
        fontFamily="DM Sans"
        fill="#f0a060"
        opacity={0.95}
      />

      {side !== 'centre' && (
        <Rect
          x={side === 'left' ? pad : pad + pitchW * 0.55}
          y={ny(0.72)}
          width={pitchW * 0.45}
          height={ny(0.22) - ny(0.72)}
          fill="#7ec8ff"
          opacity={0.1}
          cornerRadius={4}
        />
      )}

      {buildUpPattern === 'dropping-six' && (
        <Circle
          x={nx(0.5)}
          y={ny(0.34)}
          radius={Math.min(pitchW, pitchH) * 0.055}
          stroke="#7ec8ff"
          strokeWidth={1.5}
          dash={[4, 3]}
          opacity={0.85}
        />
      )}

      <Arrow
        points={[
          nx(side === 'left' ? 0.28 : side === 'right' ? 0.72 : 0.5),
          ny(0.22),
          nx(
            buildUpPattern === 'direct-into-channels'
              ? 0.72
              : side === 'left'
                ? 0.22
                : side === 'right'
                  ? 0.78
                  : 0.5,
          ),
          ny(
            buildUpPattern === 'direct-into-channels'
              ? 0.7
              : tempo === 'high'
                ? 0.62
                : 0.55,
          ),
        ]}
        pointerLength={8}
        pointerWidth={8}
        fill="#e8f0e9"
        stroke="#e8f0e9"
        strokeWidth={2}
        opacity={arrowOpacity}
      />
      {(side !== 'centre' || buildUpPattern === 'direct-into-channels') && (
        <Arrow
          points={[
            nx(side === 'right' ? 0.68 : 0.32),
            ny(0.28),
            nx(
              buildUpPattern === 'direct-into-channels'
                ? 0.22
                : side === 'left'
                  ? 0.18
                  : 0.82,
            ),
            ny(0.52),
          ]}
          pointerLength={6}
          pointerWidth={6}
          fill="#e8f0e9"
          stroke="#e8f0e9"
          strokeWidth={1.5}
          opacity={arrowOpacity * 0.7}
        />
      )}
      <Text
        x={pad + 8}
        y={ny(0.58)}
        text={`${patternLabel(buildUpPattern)} · ${tempo} tempo`}
        fontSize={11}
        fontFamily="DM Sans"
        fill="#e8f0e9"
        opacity={0.85}
      />
    </Group>
  )
}

function PressTriggerZones({
  pad,
  pitchW,
  pitchH,
  nx,
  ny,
  triggers,
}: {
  pad: number
  pitchW: number
  pitchH: number
  nx: (n: number) => number
  ny: (n: number) => number
  triggers: PressingTriggerId[]
}) {
  void pad
  if (triggers.length === 0) {
    return (
      <Text
        x={pad + 8}
        y={pad + 10}
        text="No pressing triggers armed"
        fontSize={10}
        fontFamily="DM Sans"
        fill="#8aa396"
        opacity={0.85}
      />
    )
  }

  const zones: Record<
    PressingTriggerId,
    { x: number; y: number; w: number; h: number }
  > = {
    'gk-back-pass': { x: 0.32, y: 0.88, w: 0.36, h: 0.1 },
    'cb-back-pass': { x: 0.28, y: 0.72, w: 0.44, h: 0.12 },
    'poor-first-touch': { x: 0.3, y: 0.48, w: 0.4, h: 0.14 },
    'facing-own-goal': { x: 0.34, y: 0.58, w: 0.32, h: 0.1 },
    'wide-areas': { x: 0.02, y: 0.4, w: 0.18, h: 0.35 },
  }

  return (
    <Group>
      {triggers.map((id) => {
        const zone = zones[id]
        const def = PRESSING_TRIGGERS.find((t) => t.id === id)
        const nodes = [
          <Rect
            key={`${id}-box`}
            x={nx(zone.x)}
            y={ny(zone.y + zone.h)}
            width={zone.w * pitchW}
            height={zone.h * pitchH}
            stroke="#c8f542"
            strokeWidth={1.5}
            dash={[5, 4]}
            fill="#c8f542"
            opacity={0.12}
            cornerRadius={3}
          />,
          <Text
            key={`${id}-label`}
            x={nx(zone.x) + 4}
            y={ny(zone.y + zone.h) + 4}
            text={def?.zoneLabel ?? id}
            fontSize={9}
            fontFamily="DM Sans"
            fill="#c8f542"
            opacity={0.95}
          />,
        ]
        if (id === 'wide-areas') {
          nodes.push(
            <Rect
              key={`${id}-right`}
              x={nx(0.8)}
              y={ny(0.75)}
              width={0.18 * pitchW}
              height={0.35 * pitchH}
              stroke="#c8f542"
              strokeWidth={1.5}
              dash={[5, 4]}
              fill="#c8f542"
              opacity={0.12}
              cornerRadius={3}
            />,
          )
        }
        return <Group key={id}>{nodes}</Group>
      })}
    </Group>
  )
}

function SetPiecePreview({
  pad,
  pitchW,
  pitchH,
  nx,
  ny,
  routine,
}: {
  pad: number
  pitchW: number
  pitchH: number
  nx: (n: number) => number
  ny: (n: number) => number
  routine?: SetPieceRoutine
}) {
  void pitchW
  if (!routine) {
    return (
      <Text
        x={pad + 8}
        y={pad + 10}
        text="No set-piece routine"
        fontSize={11}
        fontFamily="DM Sans"
        fill="#8aa396"
      />
    )
  }

  const target = targetZonePoint(routine.targetZone)
  const cornerX = 0.02
  const cornerY = 0.98
  const swing =
    routine.delivery === 'in-swing'
      ? 0.18
      : routine.delivery === 'out-swing'
        ? -0.12
        : 0.05

  return (
    <Group listening={false}>
      <Rect
        x={pad}
        y={pad}
        width={pitchW}
        height={pitchH * 0.28}
        fill="#9b7bff"
        opacity={0.07}
      />
      <Text
        x={pad + 8}
        y={pad + 8}
        text={`${routine.type} · ${routine.delivery} → ${routine.targetZone}`}
        fontSize={11}
        fontFamily="DM Sans"
        fill="#d4c4ff"
        opacity={0.95}
      />

      {/* Delivery arc */}
      <Arrow
        points={[
          nx(cornerX),
          ny(cornerY),
          nx(0.28 + swing),
          ny(0.92),
          nx(target.x),
          ny(target.y),
        ]}
        tension={0.4}
        pointerLength={8}
        pointerWidth={8}
        fill="#d4c4ff"
        stroke="#d4c4ff"
        strokeWidth={2}
        opacity={0.9}
      />

      {/* Target zone */}
      <Circle
        x={nx(target.x)}
        y={ny(target.y)}
        radius={Math.min(pitchW, pitchH) * 0.045}
        stroke="#d4c4ff"
        strokeWidth={1.5}
        dash={[3, 2]}
        opacity={0.9}
      />

      {/* Blockers near six-yard */}
      {routine.blockers &&
        [
          { x: 0.42, y: 0.93 },
          { x: 0.58, y: 0.93 },
        ].map((p, i) => (
          <Rect
            key={`blk-${i}`}
            x={nx(p.x) - 8}
            y={ny(p.y) - 6}
            width={16}
            height={12}
            fill="#f0a060"
            opacity={0.85}
            cornerRadius={2}
          />
        ))}

      {/* Screening runners */}
      {routine.screeningRunners &&
        [
          { from: { x: 0.22, y: 0.78 }, to: { x: 0.4, y: 0.9 } },
          { from: { x: 0.78, y: 0.78 }, to: { x: 0.6, y: 0.9 } },
        ].map((run, i) => (
          <Arrow
            key={`run-${i}`}
            points={[
              nx(run.from.x),
              ny(run.from.y),
              nx(run.to.x),
              ny(run.to.y),
            ]}
            pointerLength={6}
            pointerWidth={6}
            fill="#c8f542"
            stroke="#c8f542"
            strokeWidth={1.5}
            opacity={0.85}
          />
        ))}

      <Text
        x={pad + 8}
        y={ny(0.72)}
        text={[
          routine.blockers ? 'Blockers on' : 'No blockers',
          routine.screeningRunners ? 'Runners on' : 'No runners',
        ].join(' · ')}
        fontSize={10}
        fontFamily="DM Sans"
        fill="#d4c4ff"
        opacity={0.9}
      />
    </Group>
  )
}
