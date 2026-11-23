import type { Formation } from '../types'

export interface FormationSlot {
  id: string
  role: string
  /** Normalized pitch coords: x 0–1 (left→right), y 0–1 (own goal→opp goal) */
  x: number
  y: number
}

export const FORMATIONS: Formation[] = [
  '4-3-3',
  '4-2-3-1',
  '3-4-3',
  '4-4-2',
  '3-5-2',
  '5-3-2',
]

export const FORMATION_SLOTS: Record<Formation, FormationSlot[]> = {
  '4-3-3': [
    { id: 'gk', role: 'GK', x: 0.5, y: 0.08 },
    { id: 'rb', role: 'RB', x: 0.82, y: 0.25 },
    { id: 'rcb', role: 'RCB', x: 0.62, y: 0.22 },
    { id: 'lcb', role: 'LCB', x: 0.38, y: 0.22 },
    { id: 'lb', role: 'LB', x: 0.18, y: 0.25 },
    { id: 'cm', role: 'CM', x: 0.5, y: 0.42 },
    { id: 'rcm', role: 'RCM', x: 0.68, y: 0.48 },
    { id: 'lcm', role: 'LCM', x: 0.32, y: 0.48 },
    { id: 'rw', role: 'RW', x: 0.82, y: 0.72 },
    { id: 'st', role: 'ST', x: 0.5, y: 0.82 },
    { id: 'lw', role: 'LW', x: 0.18, y: 0.72 },
  ],
  '4-2-3-1': [
    { id: 'gk', role: 'GK', x: 0.5, y: 0.08 },
    { id: 'rb', role: 'RB', x: 0.82, y: 0.25 },
    { id: 'rcb', role: 'RCB', x: 0.62, y: 0.22 },
    { id: 'lcb', role: 'LCB', x: 0.38, y: 0.22 },
    { id: 'lb', role: 'LB', x: 0.18, y: 0.25 },
    { id: 'rdm', role: 'RDM', x: 0.62, y: 0.4 },
    { id: 'ldm', role: 'LDM', x: 0.38, y: 0.4 },
    { id: 'ram', role: 'RAM', x: 0.78, y: 0.62 },
    { id: 'cam', role: 'CAM', x: 0.5, y: 0.6 },
    { id: 'lam', role: 'LAM', x: 0.22, y: 0.62 },
    { id: 'st', role: 'ST', x: 0.5, y: 0.82 },
  ],
  '3-4-3': [
    { id: 'gk', role: 'GK', x: 0.5, y: 0.08 },
    { id: 'rcb', role: 'RCB', x: 0.72, y: 0.24 },
    { id: 'cb', role: 'CB', x: 0.5, y: 0.2 },
    { id: 'lcb', role: 'LCB', x: 0.28, y: 0.24 },
    { id: 'rm', role: 'RM', x: 0.88, y: 0.48 },
    { id: 'rcm', role: 'RCM', x: 0.62, y: 0.45 },
    { id: 'lcm', role: 'LCM', x: 0.38, y: 0.45 },
    { id: 'lm', role: 'LM', x: 0.12, y: 0.48 },
    { id: 'rw', role: 'RW', x: 0.78, y: 0.75 },
    { id: 'st', role: 'ST', x: 0.5, y: 0.82 },
    { id: 'lw', role: 'LW', x: 0.22, y: 0.75 },
  ],
  '4-4-2': [
    { id: 'gk', role: 'GK', x: 0.5, y: 0.08 },
    { id: 'rb', role: 'RB', x: 0.82, y: 0.25 },
    { id: 'rcb', role: 'RCB', x: 0.62, y: 0.22 },
    { id: 'lcb', role: 'LCB', x: 0.38, y: 0.22 },
    { id: 'lb', role: 'LB', x: 0.18, y: 0.25 },
    { id: 'rm', role: 'RM', x: 0.82, y: 0.5 },
    { id: 'rcm', role: 'RCM', x: 0.6, y: 0.48 },
    { id: 'lcm', role: 'LCM', x: 0.4, y: 0.48 },
    { id: 'lm', role: 'LM', x: 0.18, y: 0.5 },
    { id: 'rst', role: 'RST', x: 0.6, y: 0.78 },
    { id: 'lst', role: 'LST', x: 0.4, y: 0.78 },
  ],
  '3-5-2': [
    { id: 'gk', role: 'GK', x: 0.5, y: 0.08 },
    { id: 'rcb', role: 'RCB', x: 0.72, y: 0.24 },
    { id: 'cb', role: 'CB', x: 0.5, y: 0.2 },
    { id: 'lcb', role: 'LCB', x: 0.28, y: 0.24 },
    { id: 'rwb', role: 'RWB', x: 0.9, y: 0.48 },
    { id: 'rcm', role: 'RCM', x: 0.65, y: 0.45 },
    { id: 'cm', role: 'CM', x: 0.5, y: 0.42 },
    { id: 'lcm', role: 'LCM', x: 0.35, y: 0.45 },
    { id: 'lwb', role: 'LWB', x: 0.1, y: 0.48 },
    { id: 'rst', role: 'RST', x: 0.6, y: 0.78 },
    { id: 'lst', role: 'LST', x: 0.4, y: 0.78 },
  ],
  '5-3-2': [
    { id: 'gk', role: 'GK', x: 0.5, y: 0.08 },
    { id: 'rwb', role: 'RWB', x: 0.9, y: 0.32 },
    { id: 'rcb', role: 'RCB', x: 0.7, y: 0.22 },
    { id: 'cb', role: 'CB', x: 0.5, y: 0.2 },
    { id: 'lcb', role: 'LCB', x: 0.3, y: 0.22 },
    { id: 'lwb', role: 'LWB', x: 0.1, y: 0.32 },
    { id: 'rcm', role: 'RCM', x: 0.68, y: 0.5 },
    { id: 'cm', role: 'CM', x: 0.5, y: 0.48 },
    { id: 'lcm', role: 'LCM', x: 0.32, y: 0.5 },
    { id: 'rst', role: 'RST', x: 0.6, y: 0.78 },
    { id: 'lst', role: 'LST', x: 0.4, y: 0.78 },
  ],
}
