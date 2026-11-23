import type { KonvaEventObject } from 'konva/lib/Node'
import { Circle, Group, Text } from 'react-konva'
import type { PossessionMode } from '../../types'

interface PlayerTokenProps {
  id: string
  x: number
  y: number
  label: string
  mode: PossessionMode
  selected?: boolean
  /** Rest-defence / set-piece role highlight. */
  highlight?: 'rest-defence' | 'blocker' | 'runner' | null
  draggable?: boolean
  dragBoundFunc?: (pos: { x: number; y: number }) => { x: number; y: number }
  onDragEnd?: (id: string, x: number, y: number) => void
  onSelect?: (id: string) => void
}

const MODE_STYLE = {
  in: {
    fill: '#f4f7f2',
    stroke: '#c8f542',
    text: '#0a1612',
    ring: '#c8f542',
    radius: 15,
    shadowOpacity: 0.4,
  },
  out: {
    fill: '#1a3d30',
    stroke: '#8aa396',
    text: '#e8f0e9',
    ring: '#5a8a72',
    radius: 13,
    shadowOpacity: 0.55,
  },
} as const

const HIGHLIGHT_RING: Record<
  NonNullable<PlayerTokenProps['highlight']>,
  string
> = {
  'rest-defence': '#f0a060',
  blocker: '#f0a060',
  runner: '#c8f542',
}

export function PlayerToken({
  id,
  x,
  y,
  label,
  mode,
  selected = false,
  highlight = null,
  draggable = true,
  dragBoundFunc,
  onDragEnd,
  onSelect,
}: PlayerTokenProps) {
  const style = MODE_STYLE[mode]
  const radius = selected || highlight ? style.radius + 2 : style.radius
  const ring = highlight ? HIGHLIGHT_RING[highlight] : style.ring

  const handleDragEnd = (e: KonvaEventObject<DragEvent>) => {
    onDragEnd?.(id, e.target.x(), e.target.y())
  }

  return (
    <Group
      name={id}
      x={x}
      y={y}
      draggable={draggable}
      dragBoundFunc={dragBoundFunc}
      onClick={() => onSelect?.(id)}
      onTap={() => onSelect?.(id)}
      onDragEnd={handleDragEnd}
      onMouseEnter={(e) => {
        const stage = e.target.getStage()
        if (stage) stage.container().style.cursor = 'grab'
      }}
      onMouseLeave={(e) => {
        const stage = e.target.getStage()
        if (stage) stage.container().style.cursor = 'default'
      }}
      onDragStart={(e) => {
        const stage = e.target.getStage()
        if (stage) stage.container().style.cursor = 'grabbing'
        e.target.moveToTop()
      }}
    >
      <Circle
        radius={radius + 4}
        fillEnabled={false}
        stroke={ring}
        strokeWidth={highlight ? 3 : mode === 'in' ? 2 : 3}
        opacity={selected || highlight ? 0.95 : 0.55}
        dash={highlight === 'rest-defence' ? [4, 3] : mode === 'out' ? [4, 3] : undefined}
      />
      <Circle
        radius={radius}
        fill={style.fill}
        stroke={selected ? '#c8f542' : highlight ? ring : style.stroke}
        strokeWidth={selected || highlight ? 3 : 2}
        shadowColor="#000"
        shadowBlur={mode === 'in' ? 8 : 5}
        shadowOpacity={style.shadowOpacity}
        shadowOffsetY={2}
      />
      <Circle
        x={radius * 0.55}
        y={-radius * 0.55}
        radius={3.5}
        fill={
          highlight
            ? HIGHLIGHT_RING[highlight]
            : mode === 'in'
              ? '#c8f542'
              : '#f0a060'
        }
        stroke="#0a1612"
        strokeWidth={1}
      />
      <Text
        text={label}
        width={44}
        offsetX={22}
        offsetY={6}
        align="center"
        fontSize={mode === 'out' ? 9 : 10}
        fontStyle="bold"
        fill={style.text}
        fontFamily="DM Sans"
        listening={false}
      />
    </Group>
  )
}
