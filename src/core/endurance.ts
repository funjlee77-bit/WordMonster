// 끝장 퀴즈: 500단어를 한 번씩(방향은 반반 섞음) 모두 풀고, 틀린 문제만 오답 스테이지 1~3에서 다시 풀기
//  · 점수 = 처음 답의 정답 수 / 문제 수 × 100 (힌트 없음)
//  · 본선 10문제마다 콜로세움 몬스터 1마리(50칸 = 일반 30 + 희귀 20) — 일반: 10문제 중 8개 이상, 희귀: 10개 모두 → 포획
//  · 본선 90점 이상 → 레전드 1마리 포획 / 오답 스테이지마다 레전드 보스, 90점 이상 → 포획
//  · 레전드는 아직 못 잡은 콜로세움 레전드부터 순서대로. 10종을 모두 잡으면 다시 잡을 때 포획 횟수만 늘어남
import { ITEMS } from './data';
import { COLOSSEUM_FRUITS, COLOSSEUM_LEGENDS } from './fruits';
import type { Dir, GameState } from './types';

export const BLOCK = 10;
export const PASS_SCORE = 90;
export const MAX_STAGE = 3;
export interface EQ { id: string; dir: Dir }
export interface EAns { r: 'strict' | 'relaxed' | 'wrong'; a: string }
export interface Award { phase: 'main' | 'stage1' | 'stage2' | 'stage3'; fruit: string; score: number; at: string }
export interface EnduranceRun {
  id: string; startedAt: string; updatedAt: string;
  order: EQ[]; monsters: string[]; main: (EAns | null)[];
  /** 0 = 본선, 1~3 = 오답 스테이지 */
  stage: number; stageQs: EQ[]; stageAns: (EAns | null)[]; stageBoss: string | null;
  stageScores: number[]; blockCaptures: string[]; awards: Award[];
  status: 'playing' | 'phaseDone' | 'done';
}
export interface EnduranceHistory { id: string; startedAt: string; finishedAt: string; mainScore: number; stageScores: number[]; remainingWrong: number; awards: string[] }

function shuffle<T>(a: T[], rng: () => number): T[] {
  const x = a.slice(); for (let i = x.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [x[i], x[j]] = [x[j], x[i]]; } return x;
}

export function newRun(rng: () => number = Math.random, now = new Date().toISOString()): EnduranceRun {
  const items = shuffle(ITEMS, rng);
  const half = Math.floor(items.length / 2);
  const order = shuffle(items.map((it, k) => ({ id: it.id, dir: (k < half ? 'en' : 'ko') as Dir })), rng);
  const pool = COLOSSEUM_FRUITS.filter((f) => f.rarity !== 'legend').map((f) => f.id);
  const monsters = shuffle(pool, rng);
  return { id: 'end-' + Date.now(), startedAt: now, updatedAt: now, order, monsters, main: order.map(() => null),
    stage: 0, stageQs: [], stageAns: [], stageBoss: null, stageScores: [], blockCaptures: [], awards: [], status: 'playing' };
}

export const curQs = (r: EnduranceRun) => (r.stage === 0 ? r.order : r.stageQs);
export const curAns = (r: EnduranceRun) => (r.stage === 0 ? r.main : r.stageAns);
export const nextIndex = (r: EnduranceRun) => { const a = curAns(r); const i = a.findIndex((x) => x === null); return i < 0 ? a.length : i; };
export const correctCount = (ans: (EAns | null)[]) => ans.filter((x) => x && x.r !== 'wrong').length;
export const scoreOf = (ans: (EAns | null)[]) => (ans.length ? Math.round((correctCount(ans) / ans.length) * 1000) / 10 : 100);
export const monsterForIndex = (r: EnduranceRun, i: number) => r.monsters[Math.floor(i / BLOCK) % r.monsters.length];

/** 답 기록 (같은 문제를 두 번 채점하지 않음) */
export function answer(r: EnduranceRun, i: number, a: EAns, now = new Date().toISOString()): EnduranceRun {
  const list = curAns(r).slice();
  if (list[i] !== null) return r;
  list[i] = a;
  const next = { ...r, updatedAt: now, ...(r.stage === 0 ? { main: list } : { stageAns: list }) };
  if (list.every((x) => x !== null)) next.status = 'phaseDone';
  return next;
}

/** 본선 10문제 블록이 끝났는지와 포획 여부 */
export function blockResult(r: EnduranceRun, i: number): { done: boolean; correct: number; monster: string; capture: boolean } {
  const b = Math.floor(i / BLOCK), start = b * BLOCK, end = Math.min(start + BLOCK, r.order.length);
  const slice = r.main.slice(start, end);
  const monster = monsterForIndex(r, i);
  const done = slice.every((x) => x !== null);
  const correct = correctCount(slice);
  const f = COLOSSEUM_FRUITS.find((x) => x.id === monster)!;
  const need = f.rarity === 'rare' ? slice.length : Math.ceil(slice.length * 0.8);
  return { done, correct, monster, capture: done && correct >= need };
}

/** 다음에 줄 레전드: 못 잡은 것부터 순서대로, 다 잡았으면 이번 판에서 덜 나온 것 */
export function nextLegend(captured: GameState['captured'], already: string[] = []): string {
  const left = COLOSSEUM_LEGENDS.find((f) => !captured?.[f.id] && !already.includes(f.id));
  if (left) return left.id;
  const sorted = COLOSSEUM_LEGENDS.slice().sort((a, b) => (captured?.[a.id]?.count ?? 0) - (captured?.[b.id]?.count ?? 0));
  return (sorted.find((f) => !already.includes(f.id)) ?? sorted[0]).id;
}

/** 현재 단계에서 틀린 문제 목록 */
export const wrongOf = (r: EnduranceRun): EQ[] => curQs(r).filter((_, i) => curAns(r)[i]?.r === 'wrong');

/** 다음 오답 스테이지로 (틀린 문제가 없거나 3단계를 마쳤으면 done) */
export function advance(r: EnduranceRun, boss: string | null, now = new Date().toISOString()): EnduranceRun {
  const wrong = wrongOf(r);
  const scores = r.stage === 0 ? r.stageScores : [...r.stageScores, scoreOf(r.stageAns)];
  if (!wrong.length || r.stage >= MAX_STAGE) return { ...r, stageScores: scores, status: 'done', updatedAt: now };
  return { ...r, stage: r.stage + 1, stageQs: wrong, stageAns: wrong.map(() => null), stageBoss: boss, stageScores: scores, status: 'playing', updatedAt: now };
}
