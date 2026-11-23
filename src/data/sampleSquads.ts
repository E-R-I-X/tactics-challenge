import type { Player } from '../types'

const attrs = (
  pace: number,
  acceleration: number,
  stamina: number,
  passing: number,
  dribbling: number,
  finishing: number,
  decisions: number,
  anticipation: number,
  composure: number,
  tackling: number,
) => ({
  pace,
  acceleration,
  stamina,
  passing,
  dribbling,
  finishing,
  decisions,
  anticipation,
  composure,
  tackling,
})

export const SAMPLE_HOME_SQUAD: Player[] = [
  {
    id: 'p1',
    name: 'R. Ortega',
    position: 'GK',
    attributes: attrs(48, 52, 70, 55, 40, 20, 72, 75, 78, 25),
  },
  {
    id: 'p2',
    name: 'J. Walker',
    position: 'RB',
    attributes: attrs(82, 84, 80, 68, 70, 45, 65, 68, 70, 72),
  },
  {
    id: 'p3',
    name: 'M. Dias',
    position: 'CB',
    attributes: attrs(68, 65, 82, 72, 55, 40, 78, 80, 82, 85),
  },
  {
    id: 'p4',
    name: 'A. Stones',
    position: 'CB',
    attributes: attrs(72, 70, 78, 80, 72, 45, 82, 80, 84, 78),
  },
  {
    id: 'p5',
    name: 'L. Ake',
    position: 'LB',
    attributes: attrs(75, 74, 80, 74, 70, 42, 76, 78, 80, 80),
  },
  {
    id: 'p6',
    name: 'R. Rodri',
    position: 'CM',
    attributes: attrs(62, 60, 88, 90, 78, 68, 92, 88, 90, 82),
  },
  {
    id: 'p7',
    name: 'K. De Bruyne',
    position: 'CM',
    attributes: attrs(70, 68, 78, 94, 85, 82, 90, 88, 88, 55),
  },
  {
    id: 'p8',
    name: 'B. Silva',
    position: 'CM',
    attributes: attrs(78, 82, 90, 86, 90, 75, 88, 85, 86, 60),
  },
  {
    id: 'p9',
    name: 'P. Foden',
    position: 'RW',
    attributes: attrs(84, 86, 78, 84, 90, 82, 85, 82, 84, 45),
  },
  {
    id: 'p10',
    name: 'E. Haaland',
    position: 'ST',
    attributes: attrs(92, 90, 85, 65, 78, 95, 80, 88, 90, 35),
  },
  {
    id: 'p11',
    name: 'J. Doku',
    position: 'LW',
    attributes: attrs(94, 95, 75, 72, 92, 74, 70, 68, 72, 40),
  },
]

export const SAMPLE_AWAY_SQUAD: Player[] = [
  {
    id: 'a1',
    name: 'Alisson',
    position: 'GK',
    attributes: attrs(55, 58, 72, 62, 45, 22, 78, 80, 82, 28),
  },
  {
    id: 'a2',
    name: 'T. Arnold',
    position: 'RB',
    attributes: attrs(78, 76, 84, 88, 78, 70, 82, 80, 80, 70),
  },
  {
    id: 'a3',
    name: 'V. van Dijk',
    position: 'CB',
    attributes: attrs(75, 70, 82, 78, 65, 55, 88, 90, 90, 90),
  },
  {
    id: 'a4',
    name: 'I. Konate',
    position: 'CB',
    attributes: attrs(82, 80, 80, 68, 60, 45, 74, 78, 76, 86),
  },
  {
    id: 'a5',
    name: 'A. Robertson',
    position: 'LB',
    attributes: attrs(84, 82, 90, 78, 76, 55, 78, 80, 78, 78),
  },
  {
    id: 'a6',
    name: 'A. Mac Allister',
    position: 'CM',
    attributes: attrs(70, 72, 85, 86, 80, 75, 85, 84, 84, 72),
  },
  {
    id: 'a7',
    name: 'D. Szoboszlai',
    position: 'CM',
    attributes: attrs(82, 80, 82, 82, 82, 78, 80, 78, 80, 65),
  },
  {
    id: 'a8',
    name: 'C. Jones',
    position: 'CM',
    attributes: attrs(76, 78, 80, 82, 84, 68, 80, 78, 78, 70),
  },
  {
    id: 'a9',
    name: 'M. Salah',
    position: 'RW',
    attributes: attrs(90, 88, 86, 80, 88, 92, 85, 88, 90, 40),
  },
  {
    id: 'a10',
    name: 'D. Nunez',
    position: 'ST',
    attributes: attrs(92, 90, 84, 68, 78, 82, 70, 72, 74, 42),
  },
  {
    id: 'a11',
    name: 'L. Diaz',
    position: 'LW',
    attributes: attrs(90, 92, 82, 74, 88, 80, 74, 72, 76, 40),
  },
]

export interface DailyChallenge {
  id: string
  title: string
  fixture: string
  venue: string
  kickoff: string
  realManagerResult: string
  /** Hardcoded real-manager scoreline for post-match comparison. */
  realManagerScore: { home: number; away: number }
  brief: string
  homeSquad: Player[]
  awaySquad: Player[]
  homeBench: Player[]
}

export const SAMPLE_HOME_BENCH: Player[] = [
  {
    id: 'b1',
    name: 'Ederson',
    position: 'GK',
    attributes: attrs(50, 52, 68, 70, 42, 18, 74, 76, 80, 22),
  },
  {
    id: 'b2',
    name: 'N. Ake',
    position: 'CB',
    attributes: attrs(74, 72, 78, 76, 68, 40, 78, 80, 82, 82),
  },
  {
    id: 'b3',
    name: 'M. Kovacic',
    position: 'CM',
    attributes: attrs(72, 74, 82, 86, 84, 68, 84, 82, 84, 70),
  },
  {
    id: 'b4',
    name: 'J. Grealish',
    position: 'LW',
    attributes: attrs(78, 80, 80, 84, 88, 72, 82, 78, 84, 42),
  },
  {
    id: 'b5',
    name: 'J. Alvarez',
    position: 'ST',
    attributes: attrs(82, 84, 84, 78, 82, 86, 84, 82, 86, 48),
  },
]

export const TODAYS_CHALLENGE: DailyChallenge = {
  id: '2026-11-23',
  title: 'Derby Day Reset',
  fixture: 'Manchester City vs Liverpool',
  venue: 'Etihad Stadium',
  kickoff: '16:30',
  realManagerResult: 'Real manager drew 1–1',
  realManagerScore: { home: 1, away: 1 },
  brief:
    'Same squad, same fixture. Outscore the real result with your own tactical plan.',
  homeSquad: SAMPLE_HOME_SQUAD,
  awaySquad: SAMPLE_AWAY_SQUAD,
  homeBench: SAMPLE_HOME_BENCH,
}
