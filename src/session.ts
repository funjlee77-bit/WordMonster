// 화면 사이에 잠깐 넘기는 값(새로고침하면 사라져도 되는 것만)
import type { Dir } from './core/types';
export type RoundMode = 'explore' | 'wrong' | 'retry' | 'listen' | 'listenWrong';
export interface RoundConfig { chapters: number[]; mode: RoundMode; dirs: Dir[]; kingdoms?: number[] }
export interface RoundSummary {
  chapters: number[]; mode: RoundMode; total: number; strict: number; relaxed: number; aided: number; wrong: number;
  overcame: string[]; carried: { id: string; dir: Dir }[]; stars: number; xp: number; coins: number; levelUp: boolean;
  captures: { id: string; first: boolean }[]; bestStreak: number; saved: boolean;
}
export const transient: { round: RoundConfig | null; summary: RoundSummary | null } = { round: null, summary: null };
