/** Mulberry32 — deterministic [0,1) stream. */
export function createRng(seed: number): () => number {
  let t = seed >>> 0
  return () => {
    t += 0x6d2b79f5
    let r = Math.imul(t ^ (t >>> 15), 1 | t)
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r)
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296
  }
}

export function seedFrom(text: string): number {
  let h = 2166136261
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

/** Fresh 32-bit salt so each match run can diverge with the same tactics. */
export function randomSalt(): number {
  if (typeof crypto !== 'undefined' && 'getRandomValues' in crypto) {
    const buf = new Uint32Array(1)
    crypto.getRandomValues(buf)
    return buf[0]!
  }
  return (Math.random() * 0xffffffff) >>> 0
}

/**
 * Multiplier in [1−maxPct, 1−minPct] ∪ [1+minPct, 1+maxPct].
 * Default band ≈ ±8–12% for action / xG variance.
 */
export function varianceMul(
  rng: () => number,
  minPct = 0.08,
  maxPct = 0.12,
): number {
  const pct = minPct + rng() * (maxPct - minPct)
  return 1 + (rng() < 0.5 ? -pct : pct)
}

export function combineSeed(fingerprint: number, salt: number): number {
  return (fingerprint ^ salt) >>> 0
}
