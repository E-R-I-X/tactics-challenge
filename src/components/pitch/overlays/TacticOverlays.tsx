import { Arrow, Group, Line, Rect, Text } from 'react-konva'
import type {
  PossessionMode,
  PressIntensity,
  RestDefenceStructure,
  Tempo,
} from '../../../types'

interface TacticOverlaysProps {
  pad: number
  pitchW: number
  pitchH: number
  possessionMode: PossessionMode
  pressIntensity: PressIntensity
  restDefence: RestDefenceStructure
  buildUpPattern: string
  tempo: Tempo
}

const PRESS_Y: Record<PressIntensity, number> = {
  low: 0.38,
  medium: 0.52,
  high: 0.68,
  'very-high': 0.78,
}

/** Normalized rest-defence boxes: [back row count, mid row count] → y bands. */
function restDefenceBands(structure: RestDefenceStructure) {
  const [back, mid] = structure.split('-').map(Number) as [number, number]
  return {
    back,
    mid,
    backY: 0.18,
    midY: 0.34,
  }
}

export function TacticOverlays({
  pad,
  pitchW,
  pitchH,
  possessionMode,
  pressIntensity,
  restDefence,
  buildUpPattern,
  tempo,
}: TacticOverlaysProps) {
  const ny = (n: number) => pad + (1 - n) * pitchH
  const nx = (n: number) => pad + n * pitchW

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
      </Group>
    )
  }

  const bands = restDefenceBands(restDefence)
  const backSlots = Array.from({ length: bands.back }, (_, i) => {
    const t = (i + 1) / (bands.back + 1)
    return { x: nx(t), y: ny(bands.backY) }
  })
  const midSlots = Array.from({ length: bands.mid }, (_, i) => {
    const t = (i + 1) / (bands.mid + 1)
    return { x: nx(0.18 + t * 0.64), y: ny(bands.midY) }
  })

  const arrowOpacity =
    tempo === 'high' ? 0.9 : tempo === 'slow' ? 0.45 : 0.7
  const patternLabel =
    buildUpPattern === 'direct-into-channels'
      ? 'Direct channels'
      : buildUpPattern === 'patient-circulation'
        ? 'Patient circulation'
        : 'Short from back'

  return (
    <Group listening={false}>
      <Rect
        x={pad + pitchW * 0.12}
        y={ny(0.42)}
        width={pitchW * 0.76}
        height={ny(0.12) - ny(0.42)}
        fill="#f0a060"
        opacity={0.08}
        cornerRadius={4}
      />
      <Text
        x={pad + 8}
        y={ny(0.44)}
        text={`Rest defence ${restDefence}`}
        fontSize={11}
        fontFamily="DM Sans"
        fill="#f0a060"
        opacity={0.95}
      />
      {[...backSlots, ...midSlots].map((slot, i) => (
        <Rect
          key={`rd-${i}`}
          x={slot.x - 10}
          y={slot.y - 7}
          width={20}
          height={14}
          cornerRadius={3}
          stroke="#f0a060"
          strokeWidth={1.5}
          opacity={0.75}
          dash={[3, 2]}
        />
      ))}

      <Arrow
        points={[
          nx(0.5),
          ny(0.22),
          nx(buildUpPattern === 'direct-into-channels' ? 0.72 : 0.5),
          ny(tempo === 'high' ? 0.62 : 0.55),
        ]}
        pointerLength={8}
        pointerWidth={8}
        fill="#e8f0e9"
        stroke="#e8f0e9"
        strokeWidth={2}
        opacity={arrowOpacity}
      />
      {buildUpPattern !== 'short-from-back' && (
        <Arrow
          points={[
            nx(0.32),
            ny(0.28),
            nx(buildUpPattern === 'direct-into-channels' ? 0.22 : 0.28),
            ny(0.5),
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
        text={`${patternLabel} · ${tempo} tempo`}
        fontSize={11}
        fontFamily="DM Sans"
        fill="#e8f0e9"
        opacity={0.85}
      />
    </Group>
  )
}
