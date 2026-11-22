// 연속 정답 포획 규칙
//  · 왕국 탐험: 한 번 이어지는 연속 정답에서 10번째 → 일반, 15번째 → 희귀, 30번째 → 레전드 포획 (30 넘으면 40·45·60 … 같은 간격으로 반복)
//  · 재도전 스테이지: 5 → 일반, 10 → 희귀, 15 → 레전드
//  · 혼자서 맞힌 정답(엄격·완화)만 연속에 더해짐. 힌트·정답 보기로 맞힌 답은 연속을 끊지도 늘리지도 않음. 오답이면 0부터
import { MONSTERS, type MTier } from './monsters';
import type { GameState, ProgressMap } from './types';

export interface Thresholds { common: number; rare: number; legend: number }
export const TH_NORMAL: Thresholds = { common: 10, rare: 15, legend: 30 };
export const TH_RETRY: Thresholds = { common: 5, rare: 10, legend: 15 };
export const RETRY_UNLOCK = 30;

export function milestoneTier(streak: number, th: Thresholds): MTier | null {
  if (streak <= 0) return null;
  const k = ((streak - 1) % th.legend) + 1;
  return k === th.common ? 'common' : k === th.rare ? 'rare' : k === th.legend ? 'legend' : null;
}
export function nextMilestone(streak: number, th: Thresholds): { tier: MTier; at: number } {
  for (let s = streak + 1; s <= streak + th.legend + 1; s++) { const t = milestoneTier(s, th); if (t) return { tier: t, at: s }; }
  return { tier: 'common', at: streak + th.common };
}

/** 포획 대상: 고른 왕국에서 아직 못 잡은 몬스터부터 (없으면 이미 잡은 몬스터 중에서) */
export function pickTarget(tier: MTier, kingdoms: number[] | null, captured: GameState['captured'], rng: () => number = Math.random, exclude: string[] = []): string {
  const pool = MONSTERS.filter((m) => m.tier === tier && (!kingdoms || kingdoms.includes(m.kingdom)) && !exclude.includes(m.id));
  const fresh = pool.filter((m) => !captured?.[m.id]);
  const list = fresh.length ? fresh : pool.length ? pool : MONSTERS.filter((m) => m.tier === tier);
  return list[Math.floor(rng() * list.length)].id;
}

export const pendingKeys = (p: ProgressMap) => Object.entries(p).filter(([, r]) => r.pendingRetry).map(([k]) => k);
export const retryUnlocked = (p: ProgressMap) => pendingKeys(p).length >= RETRY_UNLOCK;

/* 오늘의 미션 */
export interface Daily { date: string; solved: number; bestStreak: number; overcame: number; claimed: string[] }
export const MISSIONS = [
  { id: 'solve50', label: '오늘 문제 50개 풀기', key: 'solved', goal: 50, coins: 20 },
  { id: 'streak10', label: '10연속 정답 만들기', key: 'bestStreak', goal: 10, coins: 15 },
  { id: 'overcome5', label: '예전에 틀린 단어 5개 극복하기', key: 'overcame', goal: 5, coins: 20 },
] as const;
export const freshDaily = (date: string): Daily => ({ date, solved: 0, bestStreak: 0, overcame: 0, claimed: [] });
export function bumpDaily(d: Daily | undefined, today: string, ch: { solved?: number; streak?: number; overcame?: number }): Daily {
  const x = d && d.date === today ? { ...d } : freshDaily(today);
  x.solved += ch.solved ?? 0; x.overcame += ch.overcame ?? 0; x.bestStreak = Math.max(x.bestStreak, ch.streak ?? 0);
  return x;
}
export function addCaptureTo(g: GameState, id: string, bonus: number): { game: GameState; first: boolean } {
  const first = !g.captured?.[id];
  return { first, game: { ...g, coins: g.coins + (first ? bonus : 0), captured: { ...(g.captured ?? {}), [id]: { at: g.captured?.[id]?.at ?? new Date().toISOString(), count: (g.captured?.[id]?.count ?? 0) + 1 } } } };
}
export const CAPTURE_BONUS: Record<MTier, number> = { common: 5, rare: 20, legend: 50 };
