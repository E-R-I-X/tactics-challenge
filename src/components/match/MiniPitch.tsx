interface MiniPitchProps {
  ballX: number
  ballY: number
}

/** Simplified SVG pitch with a moving ball marker. */
export function MiniPitch({ ballX, ballY }: MiniPitchProps) {
  const cx = 8 + ballX * 84
  const cy = 8 + (1 - ballY) * 84

  return (
    <svg
      viewBox="0 0 100 100"
      className="h-full w-full rounded-md border border-[var(--panel-border)] bg-[#145a40]"
      role="img"
      aria-label="Match pitch"
    >
      <rect x="4" y="4" width="92" height="92" fill="none" stroke="#1f7a55" strokeWidth="0.8" />
      <line x1="4" y1="50" x2="96" y2="50" stroke="#1f7a55" strokeWidth="0.6" />
      <circle cx="50" cy="50" r="9" fill="none" stroke="#1f7a55" strokeWidth="0.6" />
      <rect x="28" y="4" width="44" height="14" fill="none" stroke="#1f7a55" strokeWidth="0.6" />
      <rect x="28" y="82" width="44" height="14" fill="none" stroke="#1f7a55" strokeWidth="0.6" />
      <circle
        cx={cx}
        cy={cy}
        r="2.4"
        fill="#f4f0e6"
        stroke="#1a1a1a"
        strokeWidth="0.4"
        className="transition-all duration-300 ease-out"
      />
    </svg>
  )
}
